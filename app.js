// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// const mysql = require('mysql2');
// const QRCode = require('qrcode');
// require('dotenv').config();
// const cloudinary = require('cloudinary').v2;

// // Configure Cloudinary
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });


// // const port = 3000;
// const app = express();

// // Ensure folders exist
// // if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
// // if (!fs.existsSync('qrcodes')) fs.mkdirSync('qrcodes');

// // Middleware
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// app.use('/qrcodes', express.static(path.join(__dirname, 'qrcodes')));

// app.set('view engine', 'ejs');
// app.set('views', path.join(__dirname, 'views'));

// // Multer storage
// const storage = multer.memoryStorage(); // keep file in memory
// const upload = multer({ storage });


// // MySQL connection
// const db = mysql.createConnection({
//     host: process.env.DATABASE_HOST,
//     user: process.env.DATABASE_USER,
//     password: process.env.DATABASE_PASS,
//     database: process.env.DATABASE_NAME
// });

// // Routes
// app.get('/', (req, res) => res.render('index'));
// app.get('/about', (req, res) => res.render('about_animal'));
// app.get('/discussion_section', (req, res) => res.render('discuss_sec'));
// app.get('/nearby_NGOs', (req, res) => res.render('near_by_ngo.ejs'));
// app.get('/petshop', (req, res) => res.render('pet_shop.ejs'));
// app.get('/animal_qr_generate', (req, res) => res.render('view_animal'));


// // Route to show details of a specific animal
// app.get('/animal/:id', (req, res) => {

//     // console.log('Fetching details for animal ID:', req.params.id);
//     const animalId = req.params.id;

//     const sql = 'SELECT * FROM animal_info WHERE animal_id = ?';
//     db.query(sql, [animalId], (err, results) => {
//         if (err) return res.status(500).send('Database error');
//         if (results.length === 0) return res.status(404).send('Animal not found');

//         const animal = results[0];
//         console.log('Animal details:', animal);
//         res.render('about_animal_main.ejs', { animal }); // render EJS page
//     });
// });


// // POST route to add animal
// app.post('/animal_info', upload.single('photo'), async (req, res) => {
//     const { animalname, condition, description } = req.body;

//     let photoUrl = null;
//     if (req.file) {
//         try {
//             const result = await cloudinary.uploader.upload_stream(
//                 { folder: 'animal_photos' },
//                 (error, result) => {
//                     if (error) throw error;
//                     photoUrl = result.secure_url;
//                     proceed(); // Continue DB insertion after photo upload
//                 }
//             ).end(req.file.buffer);
//         } catch (err) {
//             return res.status(500).json({ error: err.message });
//         }
//     } else {
//         proceed();
//     }

//     function proceed() {
//         // Insert into DB
//         const sql = 'INSERT INTO animal_info (animal_name, animal_condition, animal_description, animal_photo) VALUES (?, ?, ?, ?)';
//         db.query(sql, [animalname, condition, description, photoUrl], async (err, result) => {
//             if (err) return res.status(500).json({ error: err.message });

//             const animalId = result.insertId;
//             console.log('Inserted animal with ID:', animalId);

//             // Generate QR code pointing to animal URL
//             const qrText = `${process.env.BASE_URL || 'http://localhost:3000'}/animal/${animalId}`;
//             const qrFileName = `animal-${animalId}.png`;

//             try {
//                 // Generate QR code as buffer
//                 const qrBuffer = await QRCode.toBuffer(qrText);

//                 // Upload QR code to Cloudinary
//                 const qrResult = await cloudinary.uploader.upload_stream(
//                     { folder: 'animal_qrcodes', public_id: `animal-${animalId}` },
//                     (err2, result2) => {
//                         if (err2) throw err2;

//                         // Update DB with QR URL
//                         const updateSql = 'UPDATE animal_info SET animal_qr_code_url = ? WHERE animal_id = ?';
//                         db.query(updateSql, [result2.secure_url, animalId], (err3) => {
//                             if (err3) return res.status(500).json({ error: err3.message });

//                             res.json({ message: 'Animal added successfully!', photoUrl, qrUrl: result2.secure_url });
//                         });
//                     }
//                 );

//                 qrResult.end(qrBuffer);

//             } catch (qrErr) {
//                 return res.status(500).json({ error: qrErr.message });
//             }
//         });
//     }
// });


// app.get("/ar", async (req, res) => {
//   try {
//     // const [animals] = await db.query("SELECT * FROM animal_info");
//     // console.log("Fetched animals for AR view:", animals);
//     // res.render("ar", { animals });

//       const sql = 'SELECT * FROM animal_info';
//     db.query(sql , (err, results) => {
//         if (err) return res.status(500).send('Database error');
//         if (results.length === 0) return res.status(404).send('Animal not found');

//             console.log('Animals for AR view:', results);

//         res.render('ar.ejs', { animal : results }); // render EJS page
//     });
//   } catch (error) {
//     console.error("Error fetching animals:", error);
//     res.status(500).send("Error loading AR view");
//   }
// });


// const port = process.env.PORT || 3000;

// // Only start server if running locally
// if (process.env.VERCEL === undefined) {
//   app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
// }

// module.exports = app;




const express = require('express');
const multer = require('multer');
const path = require('path');
const mysql = require('mysql2');
const QRCode = require('qrcode');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Multer setup (in-memory)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// MySQL connection
const db = mysql.createPool({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASS,
  database: process.env.DATABASE_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});


// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer, folder, publicId = null) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, public_id: publicId },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
};

// Routes
app.get('/', (req, res) => res.render('index'));
app.get('/about', (req, res) => res.render('about_animal'));
app.get('/discussion_section', (req, res) => res.render('discuss_sec'));
app.get('/nearby_NGOs', (req, res) => res.render('near_by_ngo.ejs'));
app.get('/petshop', (req, res) => res.render('pet_shop.ejs'));
app.get('/animal_qr_generate', (req, res) => res.render('view_animal'));

// Show details of a specific animal
app.get('/animal/:id', (req, res) => {
  const animalId = req.params.id;
  const sql = 'SELECT * FROM animal_info WHERE animal_id = ?';
  db.query(sql, [animalId], (err, results) => {
    if (err) return res.status(500).send('Database error');
    if (results.length === 0) return res.status(404).send('Animal not found');
    res.render('about_animal_main.ejs', { animal: results[0] });
  });
});

// Add animal with photo and QR code
app.post('/animal_info', upload.single('photo'), async (req, res) => {
  try {
    const { animalname, condition, description } = req.body;

    let photoUrl = null;
    if (req.file) {
      const photoResult = await uploadToCloudinary(req.file.buffer, 'animal_photos');
      photoUrl = photoResult.secure_url;
    }

    const sql = 'INSERT INTO animal_info (animal_name, animal_condition, animal_description, animal_photo) VALUES (?, ?, ?, ?)';
    db.query(sql, [animalname, condition, description, photoUrl], async (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      const animalId = result.insertId;

      const qrText = `${process.env.BASE_URL || 'http://localhost:3000'}/animal/${animalId}`;
      const qrBuffer = await QRCode.toBuffer(qrText);

      const qrResult = await uploadToCloudinary(qrBuffer, 'animal_qrcodes', `animal-${animalId}`);

      const updateSql = 'UPDATE animal_info SET animal_qr_code_url = ? WHERE animal_id = ?';
      db.query(updateSql, [qrResult.secure_url, animalId], (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ message: 'Animal added successfully!', photoUrl, qrUrl: qrResult.secure_url });
      });
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/ar', (req, res) => {
  const sql = 'SELECT * FROM animal_info';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).send('Database error');
    if (results.length === 0) return res.status(404).send('No animals found');
    res.render('ar.ejs', { animal: results });
  });
});

// Server setup
const port = process.env.PORT || 3000;
if (!process.env.VERCEL) {
  app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
}

module.exports = app;
