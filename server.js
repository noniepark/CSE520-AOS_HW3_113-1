const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// SQLite Database
const db = new sqlite3.Database('./spinning_wheel.db', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE
            )`, 
        () => {
            db.run(`
                CREATE TABLE IF NOT EXISTS profiles (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    profile_name TEXT,
                    choices TEXT,
                    probabilities TEXT,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )`);
        });
    }
});

// Routes
app.post('/join', (req, res) => {
    const { username } = req.body;
    db.run(`INSERT OR IGNORE INTO users (username) VALUES (?)`, [username], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        db.get(`SELECT id FROM users WHERE username = ?`, [username], (err, row) => {
            res.json({ userId: row.id });
        });
    });
});

app.post('/create-profile', (req, res) => {
    const { userId, profileName, choices, probabilities } = req.body;
    db.run(`
        INSERT INTO profiles (user_id, profile_name, choices, probabilities)
        VALUES (?, ?, ?, ?)`,
        [userId, profileName, JSON.stringify(choices), JSON.stringify(probabilities)],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ profileId: this.lastID });
        });
});

// Handle profile sharing
app.post('/share-profile', (req, res) => {
    const { profileId, targetUsername } = req.body;

    // Check if the target user exists
    db.get(`SELECT id FROM users WHERE username = ?`, [targetUsername], (err, targetUser) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!targetUser) {
            return res.status(400).json({ message: 'Target user does not exist.' });
        }

        // Duplicate the profile for the target user
        db.get(`SELECT * FROM profiles WHERE id = ?`, [profileId], (err, profile) => {
            if (err || !profile) {
                return res.status(500).json({ error: 'Profile not found.' });
            }

            db.run(`
                INSERT INTO profiles (user_id, profile_name, choices, probabilities)
                VALUES (?, ?, ?, ?)`,
                [targetUser.id, profile.profile_name, profile.choices, profile.probabilities],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    res.json({ message: `Profile shared with ${targetUsername} successfully.` });
                }
            );
        });
    });
});


app.get('/profiles/:userId', (req, res) => {
    const userId = req.params.userId;
    db.all(`SELECT * FROM profiles WHERE user_id = ?`, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.put('/update-profile/:id', (req, res) => {
    const { id } = req.params;
    const { profileName, choices, probabilities } = req.body;
    db.run(`
        UPDATE profiles
        SET profile_name = ?, choices = ?, probabilities = ?
        WHERE id = ?`,
        [profileName, JSON.stringify(choices), JSON.stringify(probabilities), id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ updated: this.changes });
        });
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
