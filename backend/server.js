require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = 3000;
const host = "127.0.0.1";

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

//make table
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
// const insertTestDataQuery = `INSERT INTO ph_readings (ph_value) VALUES 
//     (6.5), (7.2), (5.8), (8.1), (6.9)`;

// db.query(insertTestDataQuery, (err) => {
//     if (err) {
//         console.error("Error inserting test data: ", err);
//     } else {
//         console.log("Test data inserted successfully");
//     }
// });

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
        res.json({ message: "pH value saved successfully", id: result.insertId });
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