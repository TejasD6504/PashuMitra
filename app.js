const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2');
const QRCode = require('qrcode');
require('dotenv').config();

const port = 3000;
const app = express();

// Ensure folders exist
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
if (!fs.existsSync('qrcodes')) fs.mkdirSync('qrcodes');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/qrcodes', express.static(path.join(__dirname, 'qrcodes')));

app.set('view engine', 'ejs');

// Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// MySQL connection
const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASS,
    database: process.env.DATABASE_NAME
});

// Routes
app.get('/', (req, res) => res.render('index'));
app.get('/about', (req, res) => res.render('about_animal'));
app.get('/discussion_section', (req, res) => res.render('discuss_sec'));
app.get('/nearby_NGOs', (req, res) => res.render('near_by_ngo.ejs'));
app.get('/petshop', (req, res) => res.render('pet_shop.ejs'));
app.get('/animal_qr_generate', (req, res) => res.render('view_animal'));


// Route to show details of a specific animal
app.get('/animal/:id', (req, res) => {

    // console.log('Fetching details for animal ID:', req.params.id);
    const animalId = req.params.id;

    const sql = 'SELECT * FROM animal_info WHERE animal_id = ?';
    db.query(sql, [animalId], (err, results) => {
        if (err) return res.status(500).send('Database error');
        if (results.length === 0) return res.status(404).send('Animal not found');

        const animal = results[0];
        console.log('Animal details:', animal);
        res.render('about_animal_main.ejs', { animal }); // render EJS page
    });
});


// POST route to add animal
app.post('/animal_info', upload.single('photo'), async (req, res) => {
    const { animalname, condition, description } = req.body;
    const photo = req.file ? req.file.filename : null;

    // Insert into DB
    const sql = 'INSERT INTO animal_info (animal_name, animal_condition, animal_description, animal_photo) VALUES (?, ?, ?, ?)';
    db.query(sql, [animalname, condition, description, photo], async (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        const animalId = result.insertId;
        console.log('Inserted animal with ID:', animalId);

        // QR code contains only the ID URL
        const qrText = `http://localhost:3000/animal/${animalId}`; // later replace localhost with your IP or domain
        const qrFileName = `animal-${animalId}.png`;
        const qrPath = path.join(__dirname, 'qrcodes', qrFileName);
        const qrUrl = `/qrcodes/${qrFileName}`;

        // Generate QR code
        try {
            await QRCode.toFile(qrPath, qrText);
        } catch (qrErr) {
            return res.status(500).json({ error: qrErr.message });
        }

        // Update DB with QR URL
        const updateSql = 'UPDATE animal_info SET animal_qr_code_url = ? WHERE animal_id = ?';
        db.query(updateSql, [qrUrl, animalId], (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });

            // Return QR URL to frontend
            res.json({ message: 'Animal added successfully!', qrUrl });
        });
    });
});

app.get("/ar", async (req, res) => {
  try {
    // const [animals] = await db.query("SELECT * FROM animal_info");
    // console.log("Fetched animals for AR view:", animals);
    // res.render("ar", { animals });

      const sql = 'SELECT * FROM animal_info';
    db.query(sql , (err, results) => {
        if (err) return res.status(500).send('Database error');
        if (results.length === 0) return res.status(404).send('Animal not found');

            console.log('Animals for AR view:', results);

        res.render('ar.ejs', { animal : results }); // render EJS page
    });
  } catch (error) {
    console.error("Error fetching animals:", error);
    res.status(500).send("Error loading AR view");
  }
});


// Start server
app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
