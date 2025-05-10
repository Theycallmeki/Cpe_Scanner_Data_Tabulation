const express = require('express');
const db = require('./db'); // Ensure your db module is set up correctly
const { SerialPort, ReadlineParser } = require('serialport');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Automatically find Arduino port
async function getArduinoPort() {
  try {
    const ports = await SerialPort.list();
    console.log('Available serial ports:', ports);

    // Find any serial port with CH340 (common with cheap Arduino clones)
    const arduinoPort = ports.find((port) =>
      port.manufacturer && port.manufacturer.includes('wch.cn')
    );

    if (arduinoPort) {
      console.log('Found Arduino on port:', arduinoPort.path);
      return arduinoPort.path;
    } else {
      throw new Error('Arduino not found on any available ports');
    }
  } catch (err) {
    console.error('Error listing serial ports:', err.message);
  }
}

// Setup serial port and handle data
async function setupSerialPort() {
  try {
    const path = await getArduinoPort();
    if (!path) return;

    const arduinoPort = new SerialPort({
      path,
      baudRate: 9600,
    });

    const parser = arduinoPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    arduinoPort.on('open', () => {
      console.log(`Connected to Arduino on ${path}`);
    });

    parser.on('data', (line) => {
      const message = line.trim();
      console.log(`Received from Arduino: ${message}`);

      if (message.startsWith('Detected Tag: ')) {
        const snackName = message.replace('Detected Tag: ', '');

        if (snackName !== 'Unknown Tag') {
          db.run('INSERT INTO snack_data (snack) VALUES (?)', [snackName], function (err) {
            if (err) {
              console.error('Error saving to DB:', err.message);
            } else {
              console.log(`Saved to DB: ${snackName}`);
            }
          });
        }
      }
    });

    arduinoPort.on('error', (err) => {
      console.error('Serial Port Error:', err.message);
    });
  } catch (err) {
    console.error('Error setting up serial port:', err.message);
  }
}

setupSerialPort();

// Show all snacks
app.get('/info', (req, res) => {
  db.all('SELECT * FROM snack_data', (err, rows) => {
    if (err) {
      return res.status(500).send({ error: err.message });
    }
    res.render('info', { snacks: rows });
  });
});


// Create a new snack entry
app.post('/snacks', (req, res) => {
  const { snack } = req.body;
  db.run('INSERT INTO snack_data (snack) VALUES (?)', [snack], function (err) {
    if (err) {
      console.error('Error saving to DB:', err.message);
      return res.status(500).send({ error: err.message });
    }
    console.log(`Saved to DB: ${snack}`);
    res.redirect('/info'); // Redirect to the info page after adding
  });
});

// Edit an existing snack
app.post('/snacks/:id/edit', (req, res) => {
  const { newSnack } = req.body;
  const { id } = req.params;

  db.run('UPDATE snack_data SET snack = ? WHERE id = ?', [newSnack, id], function (err) {
    if (err) {
      console.error('Error updating snack:', err.message);
      return res.status(500).send({ error: err.message });
    }
    console.log(`Updated snack with id: ${id}`);
    res.redirect('/info'); // Redirect to the info page after update
  });
});

// Delete a snack
app.post('/snacks/:id/delete', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM snack_data WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('Error deleting snack:', err.message);
      return res.status(500).send({ error: err.message });
    }
    console.log(`Deleted snack with id: ${id}`);
    res.redirect('/info'); // Redirect to the info page after delete
  });
});



// Admin panel
app.get('/', (req, res) => {
  db.all('SELECT snack, COUNT(*) AS frequency FROM snack_data GROUP BY snack ORDER BY frequency DESC', (err, rows) => {
    if (err) {
      res.status(500).send({ error: err.message });
      return;
    }

    // Format the data for the chart
    const snackNames = rows.map(row => row.snack);
    const snackFrequencies = rows.map(row => row.frequency);

    res.render('admin', { snacks: rows, snackNames, snackFrequencies });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
