require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = 3000;
const host = "0.0.0.0";

app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error("Database connection error: ", err);
        return;
    }
    console.log("Connected to MySQL database");
});

//make table if it doesnt exist
const createTableQuery = `CREATE TABLE IF NOT EXISTS ph_readings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ph_value FLOAT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

db.query(createTableQuery, (err) => {
    if (err) {
        console.error("Error creating table: ", err);
    }
});

//test data
const insertTestDataQuery = `INSERT INTO ph_readings (ph_value, timestamp) VALUES 
(5.70, '2024-03-05 19:48:37'),
(5.58, '2024-04-02 19:48:37'),
(5.55, '2024-05-07 19:48:37'),
(5.53, '2024-06-04 19:48:37'),
(5.24, '2024-07-04 19:48:37'),
(5.13, '2024-08-19 19:48:37'),
(5.20, '2024-09-09 19:48:37'),
(5.01, '2024-10-14 19:48:37'),
(4.78, '2024-11-05 19:48:37'),
(4.77, '2024-12-12 19:48:37'),
(4.56, '2025-01-23 19:48:37'),
(4.50, '2025-02-10 19:48:37');`;


db.query(insertTestDataQuery, (err) => {
    if (err) {
        console.error("Error inserting test data: ", err);
    } else {
        console.log("Test data inserted successfully");
    }
});

// Endpoint to receive pH data
app.post("/api/ph-data", (req, res) => {
    const { ph } = req.body;
    if (!ph) {
        return res.status(400).json({ message: "Missing pH value" });
    }
    
    const insertQuery = "INSERT INTO ph_readings (ph_value) VALUES (?)";
    db.query(insertQuery, [ph], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Database error", error: err });
        }
        res.json({ message: "pH value saved successfully", id: result.insertId, ph });
    });
});

// Endpoint to fetch pH history
app.get("/api/ph-history", (req, res) => {
    db.query("SELECT * FROM ph_readings ORDER BY timestamp DESC", (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Database error", error: err });
        }
        res.json(results);
    });
});

app.listen(port, host, () => {
    console.log(`Server running at http://${host}:${port}`);
});