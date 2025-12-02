import net from "net";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import { PNG } from "pngjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ESC/POS commands
const ESC = "\x1B";
const GS = "\x1D";

const commands = {
  INIT: ESC + "@",
  CUT: GS + "V" + "\x41" + "\x03",
  FEED_LINES: (n) => ESC + "d" + String.fromCharCode(n),
  SET_ALIGN_LEFT: ESC + "a" + "\x00",
  SET_ALIGN_CENTER: ESC + "a" + "\x01",
  SET_ALIGN_RIGHT: ESC + "a" + "\x02",
  SET_FONT_A: ESC + "!" + "\x00",
  SET_BOLD_ON: ESC + "E" + "\x01",
  SET_BOLD_OFF: ESC + "E" + "\x00",
  HORIZONTAL_LINE: "-".repeat(32) + "\n",
};

// -------------- SEND COMMAND --------------
const sendCommand = (socket, command) => {
  return new Promise((resolve, reject) => {
    if (Buffer.isBuffer(command)) {
      socket.write(command, (err) => (err ? reject(err) : resolve()));
    } else {
      socket.write(command, "binary", (err) =>
        err ? reject(err) : resolve()
      );
    }
  });
};

// -------------- LOGO HANDLER --------------
let cachedLogoBuffer = null;

const loadLogoEscPos = () => {
  if (cachedLogoBuffer !== null) return cachedLogoBuffer;

  try {
    const logoPath = path.join(__dirname, "prithvi_logo.png");
    const fileData = fs.readFileSync(logoPath);
    const png = PNG.sync.read(fileData);

    const srcWidth = png.width;
    const srcHeight = png.height;

    const width = 144;
    const height = 72;
    const bytesPerRow = Math.ceil(width / 8);
    const imageBytes = Buffer.alloc(bytesPerRow * height);

    let offset = 0;
    const threshold = 150;

    for (let y = 0; y < height; y++) {
      const srcY = Math.min(
        srcHeight - 1,
        Math.floor((y + 0.5) * srcHeight / height)
      );

      for (let xByte = 0; xByte < bytesPerRow; xByte++) {
        let byte = 0;

        for (let bit = 0; bit < 8; bit++) {
          const x = xByte * 8 + bit;
          if (x >= width) continue;

          const srcX = Math.min(
            srcWidth - 1,
            Math.floor((x + 0.5) * srcWidth / width)
          );

          const idx = (srcWidth * srcY + srcX) << 2;
          const r = png.data[idx];
          const g = png.data[idx + 1];
          const b = png.data[idx + 2];
          const a = png.data[idx + 3];

          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
          if (a > 128 && luminance < threshold) byte |= 0x80 >> bit;
        }

        imageBytes[offset++] = byte;
      }
    }

    const xL = bytesPerRow & 0xff;
    const xH = (bytesPerRow >> 8) & 0xff;
    const yL = height & 0xff;
    const yH = (height >> 8) & 0xff;

    const header = Buffer.from([
      0x1d, 0x76, 0x30, 0x00,
      xL, xH, yL, yH,
    ]);

    cachedLogoBuffer = Buffer.concat([header, imageBytes]);
  } catch (err) {
    console.error("[Printer] Logo load error:", err.message);
    cachedLogoBuffer = null;
  }

  return cachedLogoBuffer;
};

loadLogoEscPos();

// -------------- PRINT BILL --------------
export const printBill = async (orderDayBill, unit, order, products) => {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.setTimeout(5000);

    socket.on("connect", async () => {
      try {
        // *** START EXACT AT THE LOGO — NO TOP SPACE ***
        await sendCommand(socket, commands.INIT);

        const logo = loadLogoEscPos();
        if (logo) {
          await sendCommand(socket, commands.SET_ALIGN_CENTER);
          await sendCommand(socket, logo);
          await sendCommand(socket, "\n");
        }

        // Unit name (NO "Powered by XTOWN")
        const unitName = (unit?.name || "")
          .toString()
          .replace(/[^\x20-\x7E]/g, "");

        if (unitName) {
          await sendCommand(socket, commands.SET_ALIGN_CENTER);
          await sendCommand(socket, unitName + "\n");
        }

        // Separator
        await sendCommand(socket, commands.SET_ALIGN_LEFT);
        await sendCommand(socket, commands.HORIZONTAL_LINE);

        // Txn + date
        await sendCommand(
          socket,
          `Txn:${order.id}  Bill:${orderDayBill.id}\n`
        );
        await sendCommand(
          socket,
          `Date:${new Date(
            orderDayBill.bill_date
          ).toLocaleDateString("en-IN")}\n`
        );
        await sendCommand(socket, commands.HORIZONTAL_LINE);

        // Products
        for (const item of products) {
          const product = item.product;
          const name = (product?.name_en || "").replace(/[^\x20-\x7E]/g, "");
          const qty = item.quantity;
          const price = Number(item.total_price || 0).toFixed(2);

          const left = `${name} x ${qty}`;
          const right = `Rs ${price}`;

          const maxWidth = 32;
          const rightLen = right.length;
          const leftMax = Math.max(0, maxWidth - rightLen - 1);
          const trimmedLeft =
            left.length > leftMax ? left.slice(0, leftMax) : left;

          const spaces = " ".repeat(
            Math.max(1, maxWidth - trimmedLeft.length - rightLen)
          );

          await sendCommand(
            socket,
            trimmedLeft + spaces + right + "\n"
          );
        }

        await sendCommand(socket, commands.HORIZONTAL_LINE);

        // Payment mode
        const mode =
          {
            UPI: "UPI Payment",
            CASH: "Paid by Cash",
            FREE: "Free Meals",
            GUEST: "Guest",
            PENDING: "Pending",
          }[order.payment_mode] || order.payment_mode;

        await sendCommand(socket, `Payment Mode: ${mode}\n`);

        // Total
        let total = 0;
        for (const i of products) total += Number(i.total_price || 0);

        await sendCommand(socket, `Total: Rs ${total.toFixed(2)}\n`);
        await sendCommand(
          socket,
          `Print Time: ${new Date().toLocaleString("en-IN")}\n`
        );

        // End (minimal extra space)
        await sendCommand(socket, commands.FEED_LINES(1));
        await sendCommand(socket, commands.CUT);

        socket.end();
        resolve(true);
      } catch (err) {
        socket.destroy();
        reject(err);
      }
    });

    socket.on("error", reject);
    socket.on("timeout", () => reject(new Error("Printer timeout")));
    socket.connect(unit.printer_port, unit.printer_ip);
  });
};

// -------------- PING --------------
export const pingPrinter = async (unit) => {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.setTimeout(2000);

    socket.on("connect", async () => {
      try {
        await sendCommand(socket, commands.INIT);
        socket.end();
        resolve(true);
      } catch (err) {
        socket.destroy();
        reject(err);
      }
    });

    socket.on("error", reject);
    socket.on("timeout", () =>
      reject(new Error("Printer ping timeout"))
    );

    socket.connect(unit.printer_port, unit.printer_ip);
  });
};
