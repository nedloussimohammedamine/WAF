const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const https = require('https');
const fs = require('fs');
const dotenv = require('dotenv');
const { spawn } = require('child_process');

dotenv.config();

const app = express();
const PORT = 3000;

const options = {
  key: fs.readFileSync(process.env.PRIVATE_KEY_PATH),
  cert: fs.readFileSync(process.env.CERTIFICATE_PATH)
};

// Create a MySQL connection pool (replace the connection details with your own)
const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'root',
  password: '0000',
  database: 'prj',
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/dashboard', (req, res) => {
  res.sendFile(__dirname + '/public/form.html');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Communicate with Python script for security checks
  const pythonProcess = spawn('python', ['firewall.py', username, password]);

  pythonProcess.stdout.on('data', (data) => {
    const result = data.toString().trim();

    if (result === 'Security checks passed') {
      // Warning: This code is intentionally vulnerable to SQL injection
      const sqlQuery = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

      // Use the connection pool to execute the vulnerable query
      pool.query(sqlQuery, (error, results) => {
        if (error) {
          console.error(error);
          res.status(500).send('Internal Server Error');
        } else {
          // Check if the user exists in the database
          if (results.length > 0) {
            // res.send(`Welcome, ${username}!`);
            res.redirect('/dashboard');
          } else {
            res.send('Invalid username or password. Please try again.');
          }
        }
      });

      // Move this line outside of the callback
      // to avoid setting headers after they are sent
      // res.send('Security checks passed, SQL query logic executed');
    } else {
      // Security checks failed
      res.json({ message: result }); // Sending as JSON
    }
  });
});


app.post('/send-message', (req, res) => {
  const message = req.body.message;

  const insertQuery = 'INSERT INTO messages (message) VALUES (?)';
  
  pool.query(insertQuery, [message], (err) => {
    if (err) {
      console.error('Error inserting message:', err);
      res.status(500).send('Internal Server Error');
    } else {
      console.log('Message inserted');
      res.redirect('/dashboard');
    }
  });
});

app.get('/get-messages', (req, res) => {
  const selectQuery = 'SELECT * FROM messages';

  pool.query(selectQuery, (err, results) => {
    if (err) {
      console.error('Error retrieving messages:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.json(results);
      eval(results);
    }
  });
});

app.post('/dashboard', (req, res) => {
  const { message } = req.body;

  const pythonProcess = spawn('python', ['firewall.py', message]);

  pythonProcess.stdout.on('data', (data) => {
    const result = data.toString().trim();

    //   if (length(result) != 0) {
    //     res.send('Security checks passed, Xss query logic executed');
    //   } else {
    //     // Security checks failed
    //     res.send(result);
    //   }
    });
});

app.get('/execute-script', (req, res) => {
  const messages = 'SELECT * FROM messages';

  const pythonProcess = spawn('python', ['firewall.py', messages]);

  pythonProcess.stdout.on('data', (data) => {
    const result = data.toString().trim();

    if (result === 'Security checks passed') {

      res.send('Security checks passed, Xss query logic executed');
    } else {
      // Security checks failed
      const script = "alert('This is a script from the database!');";
      res.send({ script });
    }
  });
});

const server = https.createServer(options, app);

server.listen(PORT, () => {
  console.log(`Server is running at https://localhost:${PORT}`);
});

