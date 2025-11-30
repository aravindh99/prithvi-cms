import net from 'net';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ESC/POS commands
const ESC = '\x1B';
const GS = '\x1D';

const commands = {
  INIT: ESC + '@',
  CUT: GS + 'V' + '\x41' + '\x03',
  FEED_LINES: (n) => ESC + 'd' + String.fromCharCode(n),
  SET_ALIGN_LEFT: ESC + 'a' + '\x00',
  SET_ALIGN_CENTER: ESC + 'a' + '\x01',
  SET_ALIGN_RIGHT: ESC + 'a' + '\x02',
  SET_FONT_A: ESC + '!' + '\x00',
  SET_FONT_B: ESC + '!' + '\x01',
  SET_BOLD_ON: ESC + 'E' + '\x01',
  SET_BOLD_OFF: ESC + 'E' + '\x00',
  SET_DOUBLE_WIDTH: ESC + '!' + '\x20',
  SET_DOUBLE_HEIGHT: ESC + '!' + '\x10',
  SET_DOUBLE_WIDTH_HEIGHT: ESC + '!' + '\x30',
  LINE_FEED: '\n',
  HORIZONTAL_LINE: '-'.repeat(32) + '\n'
};

const sendCommand = (socket, command) => {
  return new Promise((resolve, reject) => {
    socket.write(command, 'utf8', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

export const printBill = async (orderDayBill, unit, order, products) => {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    const timeout = 5000; // 5 seconds

    socket.setTimeout(timeout);

    socket.on('connect', async () => {
      try {
        // Initialize printer
        await sendCommand(socket, commands.INIT);
        await sendCommand(socket, commands.FEED_LINES(1));

        // Center align and print PRITHVI
        await sendCommand(socket, commands.SET_ALIGN_CENTER);
        await sendCommand(socket, commands.SET_BOLD_ON);
        await sendCommand(socket, commands.SET_DOUBLE_WIDTH_HEIGHT);
        await sendCommand(socket, 'PRITHVI\n');
        await sendCommand(socket, commands.SET_BOLD_OFF);
        await sendCommand(socket, commands.SET_FONT_A);
        
        // Powered by XTOWN
        await sendCommand(socket, 'Powered by XTOWN\n');
        await sendCommand(socket, commands.FEED_LINES(1));

        // Separator
        await sendCommand(socket, commands.SET_ALIGN_LEFT);
        await sendCommand(socket, commands.HORIZONTAL_LINE);
        await sendCommand(socket, commands.FEED_LINES(1));

        // Transaction details
        await sendCommand(socket, `Transaction ID: ${order.id}\n`);
        await sendCommand(socket, `Bill No: ${orderDayBill.id}\n`);
        await sendCommand(socket, `Printing Time: ${new Date().toLocaleString('en-IN')}\n`);
        await sendCommand(socket, `Bill Date: ${new Date(orderDayBill.bill_date).toLocaleDateString('en-IN')}\n`);
        await sendCommand(socket, commands.FEED_LINES(1));
        await sendCommand(socket, commands.HORIZONTAL_LINE);
        await sendCommand(socket, commands.FEED_LINES(1));

        // Products
        for (const item of products) {
          const product = item.product;
          const line = `${product.name_en} | ${product.name_ta} - ₹${parseFloat(item.unit_price).toFixed(2)} x ${item.quantity} = ₹${parseFloat(item.total_price).toFixed(2)}\n`;
          await sendCommand(socket, line);
        }

        await sendCommand(socket, commands.FEED_LINES(1));
        await sendCommand(socket, commands.HORIZONTAL_LINE);
        await sendCommand(socket, commands.FEED_LINES(1));

        // Payment mode
        let paymentModeText = '';
        switch (order.payment_mode) {
          case 'UPI':
            paymentModeText = 'UPI Payment';
            break;
          case 'CASH':
            paymentModeText = 'Paid by Cash';
            break;
          case 'FREE':
            paymentModeText = 'Free Meals';
            break;
          case 'GUEST':
            paymentModeText = 'Guest';
            break;
          case 'PENDING':
            paymentModeText = 'Pending';
            break;
          default:
            paymentModeText = order.payment_mode || 'Unknown';
            break;
        }
        await sendCommand(socket, `Payment Mode: ${paymentModeText}\n`);
        await sendCommand(socket, `Total: ₹${parseFloat(orderDayBill.amount).toFixed(2)}\n`);
        await sendCommand(socket, commands.FEED_LINES(1));
        await sendCommand(socket, `Print Time: ${new Date().toLocaleString('en-IN')}\n`);

        // Feed and cut
        await sendCommand(socket, commands.FEED_LINES(3));
        await sendCommand(socket, commands.CUT);
        await sendCommand(socket, commands.FEED_LINES(1));

        socket.end();
        resolve(true);
      } catch (error) {
        socket.destroy();
        reject(error);
      }
    });

    socket.on('error', (error) => {
      socket.destroy();
      reject(error);
    });

    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('Printer connection timeout'));
    });

    socket.connect(unit.printer_port, unit.printer_ip);
  });
};

