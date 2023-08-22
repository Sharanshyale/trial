const express = require('express');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const knex = require('./db');
const path = require('path');
const nodemailer = require('nodemailer');
const xlsx = require('xlsx');
const multer = require('multer');
const { Duplex } = require('stream');
const { Readable } = require('stream'); // Import the Duplex class
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const app = express();
const cors = require("cors");
app.use(cors());
app.use(bodyParser.json());

const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com', // e.g., 'smtp.gmail.com'
  port: 465, // or the appropriate port for your email service
  secure: true, // true for 465, false for other ports
  auth: {
    user: 'Yexah@gully2global.com',
    pass: 'Gully!23',
  },
});


async function generateProviderPlanRef() {
    try {
      const maxResult = await knex('transactions')
        .max('providerefno as maxRef')
        .first();
  
      let newNumber = 1;
      if (maxResult.maxRef) {
        const lastNumber = parseInt(maxResult.maxRef.replace("yexha", ""), 10);
        if (!isNaN(lastNumber)) {
          newNumber = lastNumber + 1;
        }
      }
  
      const paddedNumber = String(newNumber).padStart(3, "0");
      const providerplanref = "yexha" + paddedNumber;
      return providerplanref;
    } catch (err) {
      console.log("Error fetching maximum provider plan reference:", err);
      throw err;
    }
  }
  

//  ---otpfor registeration-----
  
  // Create a map to store OTPs
  // const otpMap = new Map();
  // const otpLocks = new Map();
  
  // function generateOTP() {
  //   return Math.floor(100000 + Math.random() * 900000);
  // }
  
  // app.post('/send-otp', async (req, res) => {
  //   try {
  //     const { email } = req.body;
  
  //     // Generate a new OTP
  //     const otp = generateOTP();
  //     console.log('Generated OTP:', otp);
  
  //     if (!otpLocks.has(email)) {
  //       otpLocks.set(email, new Promise((resolve) => resolve()));
  //     }
  //     await otpLocks.get(email);
  
  //     // Store the OTP
  //     otpMap.set(email, otp);
  //     otpLocks.set(email, new Promise((resolve) => resolve()));
  
  //     const mailOptions = {
  //       from: 'Yexah@gully2global.com',
  //       to: email,
  //       subject: 'OTP for Registration',
  //       text: `Your OTP for registration is: ${otp}\n\nPlease use this OTP to complete your registration.\n\nBest regards,\nYour Application Team`,
  //     };
  
  //     await transporter.sendMail(mailOptions);
  
  //     res.json({ success: true, message: 'OTP sent successfully.' });
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).json({ success: false, message: 'Error sending OTP.' });
  //   }
  // });
  
  // app.post('/register', async (req, res) => {
  //   try {
  //     const { fullname, email, password, isAdmin, otp } = req.body;
  
  //     // Check if the email already exists in the users table
  //     const existingUser = await knex('users').where({ email }).first();
  //     if (existingUser) {
  //       return res.status(400).json({ success: false, message: 'Email already registered.' });
  //     }
  
  //     if (!otpLocks.has(email)) {
  //       otpLocks.set(email, new Promise((resolve) => resolve()));
  //     }
  //     await otpLocks.get(email);
  
  //     // Get the stored OTP
  //     const storedOtp = otpMap.get(email);
  //     console.log('Stored OTP:', storedOtp);
  //     console.log('Entered OTP:', otp);
  
  //     // Verify the OTP
  //     if (!storedOtp || storedOtp !== parseInt(otp)) {
  //       return res.status(400).json({ success: false, message: 'Invalid OTP.' });
  //     }
  
  //     // Insert the new user into the users table
  //     await knex('users').insert({ fullname, email, password, isAdmin });
  
  //     // Remove the used OTP
  //     otpMap.delete(email);
  //     otpLocks.set(email, new Promise((resolve) => resolve()));
  
  //     const thankYouMailOptions = {
  //       from: 'Yexah@gully2global.com',
  //       to: email,
  //       subject: 'Thank You for Registering',
  //       text: `Dear ${fullname},\n\nThank you for registering with us!\n\nBest regards,\nYour Application Team`,
  //     };
  
  //     await transporter.sendMail(thankYouMailOptions);
  
  //     res.json({ success: true, message: 'User registered successfully.' });
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).json({ success: false, message: 'Error registering user.' });
  //   }
  // });
  
  
  

// --normalregisteration----------
app.post('/register', async (req, res) => {
  try {
    const { fullname, email, password, isAdmin } = req.body;

    // Check if the email already exists in the users table
    const existingUser = await knex('users').where({ email }).first();
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    // Insert the new user into the users table
    await knex('users').insert({ fullname, email, password, isAdmin });

    // const imagePath = 'WIN_20230524_13_27_47_Pro.jpg'; // Update with the actual image path
    // const imageBuffer = fs.readFileSync(imagePath);
    // const base64Image = imageBuffer.toString('base64');

    const mailOptions = {
      from: 'Yexah@gully2global.com', // Sender email address
      to: email, // Recipient email address (registered user's email)
      subject: 'Welcome to Our Application', // Email subject
      html: `
        <html>
          <body>
           
            <p>Dear ${fullname},</p>
            <p>Welcome to our application! Thank you for registering with us.</p>
            <p>Best regards,</p>
            <p>Your Application Team</p>
          </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: 'User registered successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error registering user.' });
  }
});



  
  // User login endpoint for normal users
  app.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await knex('users').where({ email, password, isAdmin: false }).first();
      if (user) {
        // Generate JWT token for normal user
        const token = jwt.sign({ id: user.id, isAdmin: false }, '3d01140151bfdd55621e6540cacd8203', { expiresIn: '1h' });
  
        res.json({ success: true, message: 'Login successful.', user, token });
      } else {
        res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error during login.' });
    }
  });
  
  // Admin login endpoint
  app.post('/login/admin', async (req, res) => {
    try {
      const { email, password } = req.body;
      const adminUser = await knex('users').where({ email, password, isAdmin: true }).first();
      if (adminUser) {
        // Generate JWT token for admin user
        const token = jwt.sign({ id: adminUser.id, isAdmin: true }, '3d01140151bfdd55621e6540cacd8203', { expiresIn: '1h' });
  
        res.json({ success: true, message: 'Admin login successful.', user: adminUser, token });
      } else {
        res.status(401).json({ success: false, message: 'Invalid email or password for admin.' });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error during admin login.' });
    }
  });
  
  // Admin login endpoint

  // restetoken
  
  
  // Create a map to store reset tokens
  const resetTokens = new Map();
  
  // Endpoint for sending password reset instructions
  app.post('/send-reset-email', async (req, res) => {
    try {
      const { email } = req.body;
  
      // Check if the email exists in the users table
      const existingUser = await knex('users').where({ email }).first();
      if (!existingUser) {
        return res.status(400).json({ success: false, message: 'Email not registered.' });
      }
  
      // Generate a random reset token
      const resetToken = crypto.randomBytes(20).toString('hex');
      resetTokens.set(email, resetToken);
  
      const mailOptions = {
        from: 'Yexah@gully2global.com', // Sender email address
        to: email, // Recipient email address (user's email)
        subject: 'Password Reset', // Email subject
        text: `Dear ${existingUser.fullname},\n\nYou have requested a password reset. Please use the following token to reset your password:\n\nToken: ${resetToken}\n\nThis token will expire after one use or a certain period of time.\n\nBest regards,\nYour Application Team`, // Email body
      };
  
      await transporter.sendMail(mailOptions);
  
      res.json({ success: true, message: 'Password reset token sent successfully.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Error sending reset token.' });
    }
  });
  
  // Endpoint for resetting the password using the token
  app.post('/reset-password', async (req, res) => {
    try {
      const { email, token, newPassword } = req.body;
  
      const storedToken = resetTokens.get(email);
      if (!storedToken || storedToken !== token) {
        return res.status(400).json({ success: false, message: 'Invalid reset token.' });
      }
  
      // Update the user's password in the database
      await knex('users').where({ email }).update({ password: newPassword });
  
      // Remove the used token
      resetTokens.delete(email);
  
      res.json({ success: true, message: 'Password reset successful.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Error resetting password.' });
    }
  });
 


async function generateyexahref() {
    try {
      const maxResult = await knex('transactions').max('yexahrefno as maxRef');
      let newNumber = 1;
  
      if (maxResult.length > 0 && maxResult[0].maxRef) {
        const lastNumber = parseInt(maxResult[0].maxRef.replace('yexha', ''), 10);
        if (!isNaN(lastNumber)) {
          newNumber = lastNumber + 1;
        }
      }
  
      const paddedNumber = String(newNumber).padStart(3, '0');
      const providerplanref = 'yexha' + paddedNumber;
      return providerplanref;
    } catch (err) {
      console.log('Error fetching maximum provider plan reference:', err);
      throw err;
    }
  }
  

// Create a new endpoint to insert data into the providerref table
app.post('/insert_providerplanref', async (req, res) => {
  try {
    const {
      user_id,
      how_often,
      markupPercentage,
      repairRequest,
      basePrice,
      markupMoney,
      markup,
      confirmation_for_customer_support,
      party2Name,
      party2Address,
      city,
      postalCode,
      country,
      website,
      party2PAN,
      party2GST,
      authSignatoryName,
      designation,
      authSignatoryEmailAddress,
      authSignatoryPhoneNumber,
      authSignatoryAadharNumber,
      selectedGadgets,
      selectedNumberOfGadgets,
    } = req.body;

    const doc = new PDFDocument();
    const filePath = 'TechnicalServicesAgreement.pdf';
    
    doc.fontSize(20).text('Technical Services Agreement', { align: 'center' });
    doc.moveDown(0.5);
  
    doc.fontSize(12).text('Party 1:Yexah Ventures Private Limited');
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Address: 91 Springboard, Koramangala, Bangalore`);
    doc.moveDown(0.5);
    doc.fontSize(10).text(`PAN: HOCPS9516A`);
    doc.moveDown(0.5);
    doc.fontSize(10).text(`GST: 12345678`);
    doc.moveDown(2.5);
    doc.fontSize(12).text('Party 2:', { continued: true }).fontSize(14).text(party2Name);
    doc.moveDown(0.1);
    doc.fontSize(10).text(`Address: ${party2Address}`);
    doc.moveDown(0.5);
    doc.fontSize(10).text(`PAN: ${party2PAN}`);
    doc.moveDown(0.5);
    doc.fontSize(10).text(`GST: ${party2PAN}`);
    
  
    doc.moveDown(2.5);
    doc.fontSize(14).text('Scope of Work:');
    doc.moveDown(1.5);
    doc.fontSize(12).text('Party 1 agrees to provide a custom API kit billed at the rate and instances outlined in annexure 1.');
    doc.fontSize(12).text('The API kit will be used on digital channels operated by the brand name/s of Party 2 only for the purposes outlined in annexure 1.');
    doc.moveDown(1.5);
    doc.fontSize(12).text('The API kit will have the following price encoded for use of Party 2 to upsell the services of A2Z gadget repair (provider) to its customers:');
    doc.moveDown(1.5);
    doc.fontSize(12).text(`API Kit Billing Rate: INR {apiKitBillingRate} per instance (as per final price selected by user with markup in screen 1 of deals section)`);
    // doc.fontSize(12).text(`API Kit Billing Rate: INR ${apiKitBillingRate} per instance (as per final price selected by user with markup in screen 1 of deals section)`);

    doc.moveDown(1.5);
    doc.fontSize(12).text('Annexure 1:');
    doc.moveDown(1.5);
        doc.fontSize(10).text(`Party 1 (Yexah) Billing Rate: INR {party1BillingRate} per instance (as per price without markup mentioned in screen 1 of deals section)`);
        doc.moveDown(1.5);
    // doc.fontSize(10).text(`Party 1 (Yexah) Billing Rate: INR ${party1BillingRate} per instance (as per price without markup mentioned in screen 1 of deals section)`);
    doc.fontSize(10).text('Billing Instances: On successful completion of a transaction at a digital channel of sales operated by Party 2 only. Digital channel can be website, mobile app or POS terminals. Successful completion of a transaction is the receipt of payment by Party 2 by its customer on its payment gateway and the generation of a customer copy (pdf document) by the API kit provided by Party 1');
    // doc.moveDown(1.5);
    doc.fontSize(10).text('Invoice Periodicity: Party 1 will raise a tax invoice every 7 days by consolidating all billing instances in said time period.');
    // doc.moveDown(1.5);
    doc.fontSize(10).text(`Payment terms: within 3 days of generating the invoice by party 1.`);
    
    // doc.moveDown(1.5);
    doc.fontSize(12).text('Authorized Signatory');
    // doc.moveDown(1.5);
    doc.fontSize(10).text(`Party 1  (Yexah Ventures)`);
//    doc.addPage();
   doc.fontSize(10).text(`Name:  Sandeep Kannan`);
   doc.fontSize(10).text(`Email: Sandeep@yexah.com`);
   doc.fontSize(10).text(`Phone:  9811924373}`);
   // Add a placeholder for the digital signature
   doc.text('Signature: ______________________', { align: 'right' });
 
   doc.moveDown(1);
   doc.fontSize(12).text(party2Name, { underline: true });
   doc.fontSize(10).text(`Name: ${authSignatoryName}`);
   doc.fontSize(10).text(`Email: ${authSignatoryEmailAddress}`);
   doc.fontSize(10).text(`Phone: ${authSignatoryPhoneNumber}`);
   doc.fontSize(10).text(`Designation: ${designation}`);
   // Add a placeholder for the digital signature
   doc.text('Signature: ______________________', { align: 'right' });
 
   doc.end();

   const pdfPath = path.join(__dirname, filePath);
   doc.pipe(fs.createWriteStream(pdfPath));
  
 
   // Read the generated PDF file
   const pdfBuffer = fs.readFileSync(pdfPath);
    // Check if the user exists in the users table
    const user = await knex('users').where({ id: user_id }).first();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Insert new data into the providerref table
    await knex('providerref').insert({
      user_id,
      how_often,
      markupPercentage,
      repairRequest,
      basePrice,
      markupMoney,
      markup,
      confirmation_for_customer_support,
      party2Name,
      party2Address,
      city,
      postalCode,
      country,
      website,
      party2PAN,
      party2GST,
      authSignatoryName,
      designation,
      authSignatoryEmailAddress,
      authSignatoryPhoneNumber,
      authSignatoryAadharNumber,
      selectedGadgets,
      selectedNumberOfGadgets,
    });

   
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=generated_pdf.pdf');
    res.send(pdfBuffer);
  
    

    // res.json({ success: true, message: 'Data inserted into the providerref table.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error inserting data into the providerref table.' });
  }
});

app.post('/sendPDFByEmail', (req, res) => {
    const { usersname } = req.body;
  
    // Read the generated PDF file
    const pdfPath = path.join(__dirname, 'TechnicalServicesAgreement.pdf');
    const pdfBuffer = fs.readFileSync(pdfPath);
  
    // Read the image file and encode it as base64
    // const imagePath = path.join(__dirname, 'images', 'demo.jpg');
    // const imageBase64 = fs.readFileSync(imagePath, 'base64');
  
    // Create a Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com', // Replace with your SMTP host
      port: 465, // Replace with your SMTP port
      secure: true,
      auth: {
        user: 'Yexah@gully2global.com', // Replace with your email address
        pass: 'Gully!23', // Replace with your email password
      },
    });
    const emailContent = `
    <div style="position: relative;">
    
      <h1 style="font-size: 24px;">Hi,</h1>
      <p style="font-size: 16px;">Thank you for curating your API! We are happy to share the final contract with signatures</p>
      <p style="font-size: 16px;">Happy developing!</p>
      <p style="font-size: 16px;">Best regards,</p>
      <p style="font-size: 16px;">The Yexah Team</p>
    </div>
  `;
  const mailOptions = {
    from: 'Yexah@gully2global.com', // Replace with your email address
    to: usersname, // Email address of the recipient
    subject: 'Generated PDF',
    html: emailContent,
    attachments: [
      {
        filename: 'generated_pdf.pdf',
        content: pdfBuffer,
      },
    ],
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    console.log('Email sent:', info.response);
    res.json({ message: 'Email sent successfully' });
  });
});


// Create an endpoint to retrieve data of a particular user from providerref table
app.get('/get_providerplanref/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    // Check if the user exists in the users table
    const user = await knex('users').where({ id: user_id }).first();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Fetch data from the providerref table for the given user_id
    const providerData = await knex('providerref').where({ user_id }).first();
    if (!providerData) {
      return res.status(404).json({ success: false, message: 'Provider data not found for this user.' });
    }

    res.json({ success: true, providerData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching provider data.' });
  }
});
app.get('/get_transactions/:user_id', async (req, res) => {
    try {
      const { user_id } = req.params;
  
      // Check if the user exists in the users table
      const user = await knex('users').where({ id: user_id }).first();
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }
  
      // Fetch transactions data for the given user_id
      const transactionsData = await knex('transactions').where({ user_id });
      if (!transactionsData || transactionsData.length === 0) {
        return res.status(404).json({ success: false, message: 'Transactions data not found for this user.' });
      }
  
      res.json({ success: true, transactionsData });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Error fetching transactions data.' });
    }
  });
  



app.post('/transactions', async (req, res) => {
    try {
      const {
        user_id,
        providerefno,
        // yexahrefno,
        planstart,
        planvalidity,
        invoicedate,
        invoiced,
        customername,
        email,
        transaction_value
      } = req.body;
  
      // Check if the user exists in the users table
      const user = await knex('users').where({ id: user_id }).first();
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }
      const yexahrefno = await generateyexahref();
      // Insert new data into the transactions table
      await knex('transactions').insert({
        user_id,
        providerefno,
        yexahrefno,
        planstart,
        planvalidity,
        invoicedate,
        invoiced,
        customername,
        email,
        transaction_value
      });

      
  
      res.json({ success: true, message: 'Transaction created successfully.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Error creating transaction.' });
    }
  });

// excel file importing

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

app.post('/upload', upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const excelFilePath = req.file.path;
    const workbook = xlsx.readFile(excelFilePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet);

    // Convert the data to an array of objects and add the generated providerplanref
    const values = [];
    for (const item of data) {
      const providerplanref = await generateProviderPlanRef();
      values.push({
        providerefno: providerplanref,
        yexahrefno: item.yexharrefno,
        planstart: item.planstart,
        planvalidity: item.planvalidity,
        invoicedate: item.invoicedate,
        invoiced: item.invoiced,
        customername: item.customername,
      });
    }

    // SQL query with multiple rows to be inserted
    await knex('transactions').insert(values);
    console.log('Data inserted successfully');

    res.status(200).json({ message: 'Data inserted successfully.' });
  } catch (err) {
    console.error('Error processing the request:', err);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});


// graph of 30days
app.get("/getDailyTransactions", async (req, res) => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
      const results = await knex("transactions")
        .select(knex.raw("DATE(invoicedate) as date, COUNT(*) as daily_transaction_count"))
        .where("invoicedate", ">=", thirtyDaysAgo)
        .groupByRaw("DATE(invoicedate)")
        .orderByRaw("DATE(invoicedate) DESC");
  
      res.json(results);
    } catch (error) {
      console.error('Error fetching daily transactions:', error);
      res.status(500).json({ error: 'Could not fetch daily transactions.' });
    }
  });
  
  
  






  app.post('/servicetickets', async (req, res) => {
    try {
      const {
        providerrefno,
        status, 
        date,
        issue, 
        planstart, 
        planvalidity,
        customer,
        myinvoiceno, 
        myinvoicedate,
        user_id
      } = req.body;
  
      // Check if the user exists in the users table
      const user = await knex('users').where({ id: user_id }).first();
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }
      
      // Insert new data into the transactions table
      await knex('service_tickets').insert({
        providerrefno,
        status, 
        date,
        issue, 
        planstart, 
        planvalidity,
        customer,
        myinvoiceno, 
        myinvoicedate,
        user_id
      });

      
  
      res.json({ success: true, message: 'Service ticket raised successfully.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Error rasing ticket.' });
    }
  });

// getservicetickets
  app.get('/servicetickets/:user_id', async (req, res) => {
    try {
      const { user_id } = req.params;
  
      // Check if the user exists in the users table
      const user = await knex('users').where({ id: user_id }).first();
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }
  
      // Fetch service tickets for the given user_id
      const serviceTickets = await knex('service_tickets').where({ user_id });
  
      res.json({ success: true, serviceTickets });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Error fetching service tickets.' });
    }
  });

  
  
  app.post('/providerref', async (req, res) => {
    const {
      user_id,
      how_often,
      markupPercentage,
      repairRequest,
      basePrice,
      markupMoney,
      markup,
      confirmation_for_customer_support,
      party2Name,
      party2Address,
      city,
      postalCode,
      country,
      website,
      party2PAN,
      party2GST,
      authSignatoryName,
      designation,
      authSignatoryEmailAddress,
      authSignatoryPhoneNumber,
      authSignatoryAadharNumber,
      selectedGadgets,
      selectedNumberOfGadgets,
    } = req.body;
  
    try {
      // Using Knex to insert data into the providerRef table
      await knex('providerref').insert({
        user_id,
        how_often,
        markupPercentage,
        repairRequest,
        basePrice,
        markupMoney,
        markup,
        confirmation_for_customer_support,
        party2Name,
        party2Address,
        city,
        postalCode,
        country,
        website,
        party2PAN,
        party2GST,
        authSignatoryName,
        designation,
        authSignatoryEmailAddress,
        authSignatoryPhoneNumber,
        authSignatoryAadharNumber,
        selectedGadgets,
        selectedNumberOfGadgets,
      });
  
      res.json({ message: 'Data successfully stored in the database' });
    } catch (err) {
      console.log('Error generating provider plan reference:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  






  
// ----------------------------

// app.post("/generateTechnicalServicesAgreement",async (req, res) => {
//     const {
        
//   id,
//   party2Name,
//   party2Address,
//   party2PAN, 
//   party2GST,
//   authSignatoryName, 
//   designation, 
//   authSignatoryEmailAddress,
//   authSignatoryPhoneNumber,
   
           
//     } = req.body;
  
//     const doc = new PDFDocument();
//     const filePath = "TechnicalServicesAgreement.pdf";
  
//     doc.fontSize(20).text("Technical Services Agreement", { align: "center" });
//     doc.moveDown(0.5);
  
//     doc.fontSize(12).text("Party 1:Yexah Ventures Private Limited");
//     doc.moveDown(0.5);
//     doc.fontSize(10).text(`Address: 91 Springboard, Koramangala, Bangalore`);
//     doc.moveDown(0.5);
//     doc.fontSize(10).text(`PAN: HOCPS9516A`);
//     doc.moveDown(0.5);
//     doc.fontSize(10).text(`GST: 12345678`);
//     doc.moveDown(2.5);
//     doc
//       .fontSize(12)
//       .text("Party 2:", { continued: true })
//       .fontSize(14)
//       .text(party2Name);
//     doc.moveDown(0.1);
//     doc.fontSize(10).text(`Address: ${party2Address}`);
//     doc.moveDown(0.5);
//     doc.fontSize(10).text(`PAN: ${party2PAN}`);
//     doc.moveDown(0.5);
//     doc.fontSize(10).text(`GST: ${party2GST}`);
  
//     doc.moveDown(2.5);
//     doc.fontSize(14).text("Scope of Work:");
//     doc.moveDown(1.5);
//     doc
//       .fontSize(12)
//       .text(
//         "Party 1 agrees to provide a custom API kit billed at the rate and instances outlined in annexure 1."
//       );
//     doc
//       .fontSize(12)
//       .text(
//         "The API kit will be used on digital channels operated by the brand name/s of Party 2 only for the purposes outlined in annexure 1."
//       );
//     doc.moveDown(1.5);
//     doc
//       .fontSize(12)
//       .text(
//         "The API kit will have the following price encoded for use of Party 2 to upsell the services of A2Z gadget repair (provider) to its customers:"
//       );
//     doc.moveDown(1.5);
//     doc
//       .fontSize(12)
//       .text(
//         `API Kit Billing Rate: INR {apiKitBillingRate} per instance (as per final price selected by user with markup in screen 1 of deals section)`
//       );
//     // doc.fontSize(12).text(`API Kit Billing Rate: INR ${apiKitBillingRate} per instance (as per final price selected by user with markup in screen 1 of deals section)`);
   
//    doc.moveDown(1.5);
//     doc.fontSize(12).text("Annexure 1:");
//     doc.moveDown(1.5);
//     doc
//       .fontSize(10)
//       .text(
//         `Party 1 (Yexah) Billing Rate: INR {party1BillingRate} per instance (as per price without markup mentioned in screen 1 of deals section)`
//       );
//     doc.moveDown(1.5);
//     // doc.fontSize(10).text(`Party 1 (Yexah) Billing Rate: INR ${party1BillingRate} per instance (as per price without markup mentioned in screen 1 of deals section)`);
//     doc
//       .fontSize(10)
//       .text(
//         "Billing Instances: On successful completion of a transaction at a digital channel of sales operated by Party 2 only. Digital channel can be website, mobile app or POS terminals. Successful completion of a transaction is the receipt of payment by Party 2 by its customer on its payment gateway and the generation of a customer copy (pdf document) by the API kit provided by Party 1"
//       );
//     doc.moveDown(1.5);
//     doc
//       .fontSize(10)
//       .text(
//         "Invoice Periodicity: Party 1 will raise a tax invoice every 7 days by consolidating all billing instances in said time period."
//       );
//     // doc.moveDown(1.5);
//     doc
//       .fontSize(10)
//       .text(`Payment terms: within 3 days of generating the invoice by party 1.`);
  
//     doc.fontSize(12).text("Authorized Signatory");
//     doc.fontSize(10).text(`Party 1  (Yexah Ventures)`);
//     doc.addPage();
  
//     doc.fontSize(10).text(`Name:  Sandeep Kannan`);
//     doc.fontSize(10).text(`Email: Sandeep@yexah.com`);
//     doc.fontSize(10).text(`Phone:  9811924373}`);
//     // Add a placeholder for the digital signature
//     doc.text("Signature: ________", { align: "right" });
  
//     doc.moveDown(1);
//     doc.fontSize(12).text(party2Name, { underline: true });
//     doc.fontSize(10).text(`Name: ${authSignatoryName}`);
//     doc.fontSize(10).text(`Email: ${authSignatoryEmailAddress}`);
//     doc.fontSize(10).text(`Phone: ${authSignatoryPhoneNumber}`);
//     doc.fontSize(10).text(`Phone: ${designation}`);
//     // Add a placeholder for the digital signature
//     doc.text("Signature: ________", { align: "right" });
  
//     doc.end();
  
//     // Save the generated PDF to a file
//     const pdfPath = path.join(__dirname, filePath);
//     doc.pipe(fs.createWriteStream(pdfPath));
  
//     // Read the generated PDF file
//     const pdfBuffer = fs.readFileSync(pdfPath);
  
//     // Store the generated PDF in the database
//     try {
//         // Store the generated PDF in the database using Knex
//         const updatedRows = await knex('users')
//           .where({ id }) // Assuming the primary key is 'email'
//           .update({ pdf_data: pdfBuffer });
    
//         // Check if the update was successful
//         if (updatedRows === 1) {
//           console.log('PDF data updated in the database.');
//         } else {
//           console.error('Failed to update PDF data in the database.');
//         }
    
//         // Send the generated PDF as a response
//         res.setHeader("Content-Type", "application/pdf");
//         res.setHeader(
//           "Content-Disposition",
//           "attachment; filename=generated_pdf.pdf"
//         );
//         res.send(pdfBuffer);
//       } catch (error) {
//         console.error("Error generating Technical Services Agreement:", error);
//         res.status(500).json({ error: "Internal Server Error" });
//       }
//       })
  
  
  // ...
  
  // ...
  
  // Endpoint to send the generated PDF via email
  app.post("/sendPDFByEmail", (req, res) => {
    const { usersname } = req.body;
  
    // Read the generated PDF file
    const pdfPath = path.join(__dirname, `TechnicalServicesAgreement.pdf`);
    const pdfBuffer = fs.readFileSync(pdfPath);
  
    // Create a Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com", // Replace with your SMTP host
      port: 465, // Replace with your SMTP port
      secure: true,
      auth: {
        user: "Yexah@gully2global.com", // Replace with your email address
        pass: "Gully!23", // Replace with your email password
      },
    });
  
    // Configure the email options
    const mailOptions = {
      from: "Yexah@gully2global.com", // Replace with your email address
      to: usersname, // Email address of the recipient
      subject: "Generated PDF",
      text: "Please find the generated PDF attached.",
      attachments: [
        {
          filename: "generated_pdf.pdf",
          content: pdfBuffer,
        },
      ],
    };
  
    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }
  
      console.log("Email sent:", info.response);
      res.json({ message: "Email sent successfully" });
    });
  });
  
// storeimages-------------------
// Endpoint to upload images and PDF to create a new document

  
  // Endpoint to get a document by doc_id
  app.get('/documents/:doc_id', async (req, res) => {
    try {
      const { doc_id } = req.params;
  
      // Retrieve the document from the database
      const document = await db('documents').where('doc_id', doc_id).first();
  
      res.json(document);
    } catch (error) {
      console.error('Error retrieving document:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Endpoint to update a document by doc_id
//   app.put('/documents/:doc_id', async (req, res) => {
//     try {
//       const { doc_id } = req.params;
//       const { user_id } = req.body;
  
//       // Update the document in the database
//       await db('documents').where('doc_id', doc_id).update({ user_id });
  
//       res.json({ message: 'Document updated successfully' });
//     } catch (error) {
//       console.error('Error updating document:', error);
//       res.status(500).json({ error: 'Internal server error' });
//     }
//   });
  
  // Start the server
//   const port = 3000;
//   app.listen(port, () => {
//     console.log(`Server is running on http://localhost:${port}`);
//   });
  

app.post('/save-signature', async (req, res) => {
  const { user_id, signature_image } = req.body;

  try {
    // Insert the signature into the signatures table
    await knex('signatures').insert({
      user_id: user_id, // Provide the user_id value
      signature_image: signature_image
    });

    res.status(200).json({ message: 'Signature saved successfully' });
  } catch (err) {
    console.error('Error saving signature:', err);
    res.status(500).json({ error: 'Error saving signature' });
  }
});


app.post('/save-imagedata', async (req, res) => {
  const { user_id, gst_image,adharcard_image,pancard_image,logo_image } = req.body;

  try {
    // Insert the signature into the signatures table
    await knex('documents').insert({
      user_id: user_id, // Provide the user_id value
      gst: gst_image,
      adharcard:adharcard_image,
      pancard:pancard_image,
      logo:logo_image
    });

    res.status(200).json({ message: 'documents saved successfully' });
  } catch (err) {
    console.error('Error saving documents:', err);
    res.status(500).json({ error: 'Error saving documents' });
  }
});


app.post('/save-admin-signature', async (req, res) => {
  const { user_id, signature_image } = req.body;

  try {
    // Insert the signature into the signatures table
    await knex('signatures')
    .where('id', user_id)
    .update('adminsign', signature_image);

    res.status(200).json({ message: 'Signature saved successfully' });
  } catch (err) {
    console.error('Error saving signature:', err);
    res.status(500).json({ error: 'Error saving signature' });
  }
});

// app.post("/generateAgreementWithSignature", async (req, res) => {
//   const {
//     id,
//     party2Name,
//     party2Address,
//     party2PAN,
//     party2GST,
//     authSignatoryName,
//     designation,
//     authSignatoryEmailAddress,
//     authSignatoryPhoneNumber,
//     signatureImageData, // The signature image data you want to add
//   } = req.body;

//   const doc = new PDFDocument();
//   const filePath = "TechnicalServicesAgreementWithSignature.pdf";

//   // Load the template content and create the rest of the PDF content here
//   doc.fontSize(20).text("Technical Services Agreement", { align: "center" });
//   doc.moveDown(0.5);
//   doc.fontSize(12).text("Party 1:Yexah Ventures Private Limited");
//     doc.moveDown(0.5);
//     doc.fontSize(10).text(`Address: 91 Springboard, Koramangala, Bangalore`);
//     doc.moveDown(0.5);
//     doc.fontSize(10).text(`PAN: HOCPS9516A`);
//     doc.moveDown(0.5);
//     doc.fontSize(10).text(`GST: 12345678`);
//     doc.moveDown(2.5);
//     doc
//       .fontSize(12)
//       .text("Party 2:", { continued: true })
//       .fontSize(14)
//       .text(party2Name);
//     doc.moveDown(0.1);
//     doc.fontSize(10).text(`Address: ${party2Address}`);
//     doc.moveDown(0.5);
//     doc.fontSize(10).text(`PAN: ${party2PAN}`);
//     doc.moveDown(0.5);
//     doc.fontSize(10).text(`GST: ${party2GST}`);
  
//     doc.moveDown(2.5);
//     doc.fontSize(14).text("Scope of Work:");
//     doc.moveDown(1.5);
//     doc
//       .fontSize(12)
//       .text(
//         "Party 1 agrees to provide a custom API kit billed at the rate and instances outlined in annexure 1."
//       );
//     doc
//       .fontSize(12)
//       .text(
//         "The API kit will be used on digital channels operated by the brand name/s of Party 2 only for the purposes outlined in annexure 1."
//       );
//     doc.moveDown(1.5);
//     doc
//       .fontSize(12)
//       .text(
//         "The API kit will have the following price encoded for use of Party 2 to upsell the services of A2Z gadget repair (provider) to its customers:"
//       );
//     doc.moveDown(1.5);
//     doc
//       .fontSize(12)
//       .text(
//         `API Kit Billing Rate: INR {apiKitBillingRate} per instance (as per final price selected by user with markup in screen 1 of deals section)`
//       );
//     // doc.fontSize(12).text(`API Kit Billing Rate: INR ${apiKitBillingRate} per instance (as per final price selected by user with markup in screen 1 of deals section)`);
   
//    doc.moveDown(1.5);
//     doc.fontSize(12).text("Annexure 1:");
//     doc.moveDown(1.5);
//     doc
//       .fontSize(10)
//       .text(
//         `Party 1 (Yexah) Billing Rate: INR {party1BillingRate} per instance (as per price without markup mentioned in screen 1 of deals section)`
//       );
//     doc.moveDown(1.5);
//     // doc.fontSize(10).text(`Party 1 (Yexah) Billing Rate: INR ${party1BillingRate} per instance (as per price without markup mentioned in screen 1 of deals section)`);
//     doc
//       .fontSize(10)
//       .text(
//         "Billing Instances: On successful completion of a transaction at a digital channel of sales operated by Party 2 only. Digital channel can be website, mobile app or POS terminals. Successful completion of a transaction is the receipt of payment by Party 2 by its customer on its payment gateway and the generation of a customer copy (pdf document) by the API kit provided by Party 1"
//       );
//     doc.moveDown(1.5);
//     doc
//       .fontSize(10)
//       .text(
//         "Invoice Periodicity: Party 1 will raise a tax invoice every 7 days by consolidating all billing instances in said time period."
//       );
//     // doc.moveDown(1.5);
//     doc
//       .fontSize(10)
//       .text(`Payment terms: within 3 days of generating the invoice by party 1.`);
  
//     doc.fontSize(12).text("Authorized Signatory");
//     doc.fontSize(10).text(`Party 1  (Yexah Ventures)`);
//     doc.addPage();
  
//     doc.fontSize(10).text(`Name:  Sandeep Kannan`);
//     doc.fontSize(10).text(`Email: Sandeep@yexah.com`);
//     doc.fontSize(10).text(`Phone:  9811924373}`);
//     // Add a placeholder for the digital signature
//     doc.text("Signature: ________", { align: "right" });
  
//     doc.moveDown(1);
//     doc.fontSize(12).text(party2Name, { underline: true });
//     doc.fontSize(10).text(`Name: ${authSignatoryName}`);
//     doc.fontSize(10).text(`Email: ${authSignatoryEmailAddress}`);
//     doc.fontSize(10).text(`Phone: ${authSignatoryPhoneNumber}`);
//     doc.fontSize(10).text(`Phone: ${designation}`);
//     // Add a placeholder for the digital signature
//     doc.text("Signature: ________", { align: "right" });

//   // Add the signature image to the PDF
//   if (signatureImageData) {
//     const signatureImage = Buffer.from(signatureImageData, "base64");
//     const x = 500; // Adjust the X-coordinate for placing the signature image
//     const y = 145; // Adjust the Y-coordinate for placing the signature image
//     const width = 50; // Adjust the width of the signature image
//     const height = 30; // Adjust the height of the signature image
//     doc.image(signatureImage, x, y, { width, height });
//   }

//   // Continue adding the rest of the PDF content
//   // ... (remaining content code here)

//   doc.end();

//   // Save the generated PDF to a file
//   const pdfPath = path.join(__dirname, filePath);
//   doc.pipe(fs.createWriteStream(pdfPath));

//   // Read the generated PDF file
//   const pdfBuffer = fs.readFileSync(pdfPath);

//   // Store the generated PDF in the database
//   try {
//     // Store the generated PDF in the database using Knex
//     const updatedRows = await knex("users")
//       .where({ id }) // Assuming the primary key is 'id'
//       .update({ pdf_signedcontract: pdfBuffer });

//     // Check if the update was successful
//     if (updatedRows === 1) {
//       console.log("PDF data updated in the database.");
//     } else {
//       console.error("Failed to update PDF data in the database.");
//     }

//     // Send the generated PDF as a response
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       "attachment; filename=generated_pdf_with_signature.pdf"
//     );
//     res.send(pdfBuffer);
//   } catch (error) {
//     console.error("Error generating Agreement with Signature:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });


// app.post("/generateAgreementyexahSignaturez", async (req, res) => {
//   const {
//     id,
//     party2Name,
//     party2Address,
//     party2PAN,
//     party2GST,
//     authSignatoryName,
//     designation,
//     authSignatoryEmailAddress,
//     authSignatoryPhoneNumber,
//      signatureImageData,
//     // adminsignatureImageData, // The signature image data you want to add
//   } = req.body;

//   const doc = new PDFDocument();
//   const filePath = "TechnicalServicesAgreementWithSignature.pdf";

//   // Load the template content and create the rest of the PDF content here
//   doc.fontSize(20).text("Technical Services Agreement", { align: "center" });
//   doc.moveDown(0.5);
//   doc.fontSize(12).text("Party 1:Yexah Ventures Private Limited");
//     doc.moveDown(0.5);
//     doc.fontSize(10).text(`Address: 91 Springboard, Koramangala, Bangalore`);
//     doc.moveDown(0.5);
//     doc.fontSize(10).text(`PAN: HOCPS9516A`);
//     doc.moveDown(0.5);
//     doc.fontSize(10).text(`GST: 12345678`);
//     doc.moveDown(2.5);
//     doc
//       .fontSize(12)
//       .text("Party 2:", { continued: true })
//       .fontSize(14)
//       .text(party2Name);
//     doc.moveDown(0.1);
//     doc.fontSize(10).text(`Address: ${party2Address}`);
//     doc.moveDown(0.5);
//     doc.fontSize(10).text(`PAN: ${party2PAN}`);
//     doc.moveDown(0.5);
//     doc.fontSize(10).text(`GST: ${party2GST}`);
  
//     doc.moveDown(2.5);
//     doc.fontSize(14).text("Scope of Work:");
//     doc.moveDown(1.5);
//     doc
//       .fontSize(12)
//       .text(
//         "Party 1 agrees to provide a custom API kit billed at the rate and instances outlined in annexure 1."
//       );
//     doc
//       .fontSize(12)
//       .text(
//         "The API kit will be used on digital channels operated by the brand name/s of Party 2 only for the purposes outlined in annexure 1."
//       );
//     doc.moveDown(1.5);
//     doc
//       .fontSize(12)
//       .text(
//         "The API kit will have the following price encoded for use of Party 2 to upsell the services of A2Z gadget repair (provider) to its customers:"
//       );
//     doc.moveDown(1.5);
//     doc
//       .fontSize(12)
//       .text(
//         `API Kit Billing Rate: INR {apiKitBillingRate} per instance (as per final price selected by user with markup in screen 1 of deals section)`
//       );
//     // doc.fontSize(12).text(`API Kit Billing Rate: INR ${apiKitBillingRate} per instance (as per final price selected by user with markup in screen 1 of deals section)`);
   
//    doc.moveDown(1.5);
//     doc.fontSize(12).text("Annexure 1:");
//     doc.moveDown(1.5);
//     doc
//       .fontSize(10)
//       .text(
//         `Party 1 (Yexah) Billing Rate: INR {party1BillingRate} per instance (as per price without markup mentioned in screen 1 of deals section)`
//       );
//     doc.moveDown(1.5);
//     // doc.fontSize(10).text(`Party 1 (Yexah) Billing Rate: INR ${party1BillingRate} per instance (as per price without markup mentioned in screen 1 of deals section)`);
//     doc
//       .fontSize(10)
//       .text(
//         "Billing Instances: On successful completion of a transaction at a digital channel of sales operated by Party 2 only. Digital channel can be website, mobile app or POS terminals. Successful completion of a transaction is the receipt of payment by Party 2 by its customer on its payment gateway and the generation of a customer copy (pdf document) by the API kit provided by Party 1"
//       );
//     doc.moveDown(1.5);
//     doc
//       .fontSize(10)
//       .text(
//         "Invoice Periodicity: Party 1 will raise a tax invoice every 7 days by consolidating all billing instances in said time period."
//       );
//     // doc.moveDown(1.5);
//     doc
//       .fontSize(10)
//       .text(`Payment terms: within 3 days of generating the invoice by party 1.`);
  
//     doc.fontSize(12).text("Authorized Signatory");
//     doc.fontSize(10).text(`Party 1  (Yexah Ventures)`);
//     doc.addPage();
  
//     doc.fontSize(10).text(`Name:  Sandeep Kannan`);
//     doc.fontSize(10).text(`Email: Sandeep@yexah.com`);
//     doc.fontSize(10).text(`Phone:  9811924373}`);
//     // Add a placeholder for the digital signature
//     doc.text("Signature: __", { align: "right" });
  
//     doc.moveDown(1);
//     doc.fontSize(12).text(party2Name, { underline: true });
//     doc.fontSize(10).text(`Name: ${authSignatoryName}`);
//     doc.fontSize(10).text(`Email: ${authSignatoryEmailAddress}`);
//     doc.fontSize(10).text(`Phone: ${authSignatoryPhoneNumber}`);
//     doc.fontSize(10).text(`Phone: ${designation}`);
//     // Add a placeholder for the digital signature
//     doc.text("Signature: __", { align: "right" });

//   // Add the signature image to the PDF
//   // if (signatureImageData) {
//   //   const signatureImage = Buffer.from(signatureImageData, "base64");
//   //   const x = 500; // Adjust the X-coordinate for placing the signature image
//   //   const y = 145; // Adjust the Y-coordinate for placing the signature image
//   //   const width = 50; // Adjust the width of the signature image
//   //   const height = 30; // Adjust the height of the signature image
//   //   doc.image(signatureImage, x, y, { width, height });
//   // }
// // Add the adminsignature image to the PDF
// if (adminsignatureImageData) {
//   const signatureImage = Buffer.from(signatureImageData, "base64");
//   const x = 500; // Adjust the X-coordinate for placing the signature image
//   const y = 100; // Adjust the Y-coordinate for placing the signature image
//   const width = 50; // Adjust the width of the signature image
//   const height = 30; // Adjust the height of the signature image
//   doc.image(signatureImage, x, y, { width, height });
// }
//   // Continue adding the rest of the PDF content
//   // ... (remaining content code here)

//   doc.end();

//   // Save the generated PDF to a file
//   const pdfPath = path.join(__dirname, filePath);
//   doc.pipe(fs.createWriteStream(pdfPath));

//   // Read the generated PDF file
//   const pdfBuffer = fs.readFileSync(pdfPath);

//   const mailOptions = {
//     from: 'Yexah@gully2global.com',
//     to: authSignatoryEmailAddress, // Replace with the recipient's email address
//     subject: 'Generated Agreement with Signature',
//     text: 'Please find the attached PDF document.',
//     attachments: [
//       {
//         filename: 'generated_pdf_with_signature.pdf',
//         content: pdfBuffer, // Use the generated PDF buffer
//       },
//     ],
//   };
//  // Send the email
//  transporter.sendMail(mailOptions, (error, info) => {
//   if (error) {
//     console.error('Error sending email:', error);
//     res.status(500).json({ error: 'Error sending email' });
//   } else {
//     console.log('Email sent:', info.response);
//     res.status(200).json({ message: 'PDF generated and emailed successfully' });
//   }
// });



//   // Store the generated PDF in the database
//   try {
//     // Store the generated PDF in the database using Knex
//     const updatedRows = await knex("users")
//       .where({ id }) // Assuming the primary key is 'id'
//       .update({ pdf_finalsignedcontract: pdfBuffer });

//     // Check if the update was successful
//     if (updatedRows === 1) {
//       console.log("PDF data updated in the database.");
//     } else {
//       console.error("Failed to update PDF data in the database.");
//     }

//     // Send the generated PDF as a response
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       "attachment; filename=generated_pdf_with_signature.pdf"
//     );
//     res.send(pdfBuffer);
//   } catch (error) {
//     console.error("Error generating Agreement with Signature:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
  
// });

app.post("/generateAgreementyexahSignature1", async (req, res) => {
  const {
    id,
    party2Name,
    party2Address,
    party2PAN,
    party2GST,
    authSignatoryName,
    designation,
    authSignatoryEmailAddress,
    authSignatoryPhoneNumber,
    signatureImageData,
    // adminsignatureImageData, // The signature image data you want to add
  } = req.body;

  const doc = new PDFDocument();
  const filePath = "TechnicalServicesAgreementWithSignature.pdf";

  // Load the template content and create the rest of the PDF content here
  doc.fontSize(12).text("CLIENT AGREEMENT", { align: "center" });
  doc.moveDown(0.5);
  doc
    .moveTo(100, doc.y + 10)
    .lineTo(500, doc.y + 10)
    .stroke(); // Add a line below the text
  doc.moveDown(1.5);
  doc
    .fontSize(12)
    .text(
      "This CLIENT AGREEMENT (hereinafter referred to as the “Agreement”) is made and entered into on the [●XXXX], (hereinafter referred to as “Effective Date”) by and between: "
    );
 
  doc
    .font("Helvetica-Bold").fontSize(10)
    .text("Yexah Ventures Private Limited", { continued: true }).
  
    
    text(
      " a private limited company incorporated under the Companies Act, 2013, having its registered office at 91 Springboard, 1st Floor Gopala Krishna Complex, No. 45/3 Residency Road, M G Road Museum Road, Bangalore: 560025 (hereinafter referred to as the “Yexah”, which expression shall, unless repugnant to the context or meaning thereof, include its successors and permitted assigns) of the FIRST PART; "
    );
  doc.moveDown(1.0);
  doc.font("Helvetica-Bold").text("AND");
  doc.moveDown(1.0);
  doc
    .fontSize(10)
    .text(
      ` ${party2Name}, located at  ${party2Address}, (hereinafter referred to as the “Client”, which expression shall, unless repugnant to the context or meaning thereof, include its successors and permitted assigns) of the SECOND PART.`
    );
  doc.moveDown(1.0);
  doc
    .fontSize(10)
    .text(
      "Yexah and Client shall hereinafter be individually referred to as “Party” and collectively referred to as “Parties”, as the context may deem fit."
    );
  doc.moveDown(1.0);
  doc.font("Helvetica-Bold").text("WHEREAS:", { align: "Left" });
  doc.moveDown(1.0);
  doc
    .text("1 ", {continued : true}).fontSize(10)
    .text(
      "Yexah is a B2B online web portal, inter alia, engaged in the business of offering curated deals that can be embedded through an easy plug and play API structure."
    );
  doc.moveDown(0.5);
  doc
    .text("2 ",{continued : true}).fontSize(10)
    .text(
      "Client has approached Yexah to access such curated deals offered via Yexah’s single unified platform (“Platform”). Such curated deals availed by the Client shall be listed under Client’s profile on the Platform from time to time."
    );
  doc.moveDown(0.5);
  doc
    .text("3 ",{continued : true}).fontSize(10)
    .text(
      "The Parties are now entering into this Agreement to formalise the terms of the arrangement between the Parties and for regulating the relationship of the Parties, their inter-se rights and obligations with respect to each other as per the terms and conditions mutually agreed and set forth in this Agreement. "
    );
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold").fontSize(12)
    .text(
      " NOW THEREFORE THIS AGREEMENT WITNESSETH AND IT IS AGREED BY AND BETWEEN THE PARTIES AS UNDER: "
    );
    doc.moveDown(0.5);
  doc
    .font("Helvetica-Bold")
    .text("1 ",{continued : true}).fontSize(10)
    .text("DEFINITIONS AND INTERPRETATION", { underline: true });
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("1.1  ").fontSize(10)
    .text("Defination",  { continued: true })
  .fontSize(10).text(
    "As used in this Agreement, the terms and expressions when used with capitalized first letter shall, unless the context otherwise requires, have the meaning assigned to them in this Clause below and all capitalised terms not defined in this Clause shall have the meaning assigned to them in the other parts of this Agreement when defined for use in bold letters enclosed within quotes (“”): "
  );
  // newpage
  doc.addPage();
  doc
  .font("Helvetica-Bold")
  .text("1.1.1  ", { continued: true })
  .fontSize(10)
  .text("Agreement", { continued: true })
  .fontSize(10)
  .text(
    "means this client agreement, as amended in writing from time to time in accordance with the provisions hereof and shall include all the schedules and/or annexures attached to this Agreement. "
  )
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("1.1.2  ",{continued : true})
    .fontSize(10)
    .text("Applicable", { continued: true }).
  fontSize(10)
  .text(
    "means any statute, law, regulation, ordinance, rule, judgment, order, decree, bye-law, approval of any governmental authority, directive, guideline, policy, requirement or other governmental restriction or any similar form of decision of or determination by, or any interpretation or administration having the force of law of any of the foregoing, or which is generally followed, by any governmental authority having jurisdiction, applicable to the Parties, in force, from time to time, wherever the Parties conduct their respective businesses. "
  );
  doc.moveDown(1.0);
  doc.font("Helvetica-Bold").text("1.1.3  ",{continued : true}).fontSize(10).text("Api", { continued: true }).
  fontSize(10).text("means application programming interface. ");
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("1.1.4  ",{continued : true}).fontSize(10)
    .text("Availed third-party offering(s)", { continued: true }).
  fontSize(10).text("means as the term as defined in Clause 2.3 of the Agreement.  ");
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("1.1.5  ")
    .text("Confidential Information", { continued: true }).
  fontSize(10).text(
    "shall mean all non-public, commercially proprietary or sensitive information relating to the development, utility, operation, functionality, performance, cost, present and proposed businesses, formulae, ideas, strategies, techniques, policy, data of the disclosing Party including but not limited to personal information, commercial, technical and artistic information relating to the disclosing Party’s establishment, maintenance, marketing and promotion of its own services, experimental work, customers, financial information, marketing plans, business plans, project plans, information relating to sales, costs, operating income,  software, technology, methods, data, files, or other materials provided by the disclosing Party in any form or medium, tangible or intangible, either orally, in writing or in machine readable form or through visual observation or learnt or accessed by any other means by the receiving Party, whether or not identified as “confidential”  or “proprietary” or similar designation expressly. Confidential Information and obligations thereto shall apply irrespective of the form in or the media on which such information is displayed or contained. The recipient will however be able to use collaterals for branding or marketing purposes only after prior written approval has been provided by the disclosing Party. For avoidance of doubt, the term “Confidential Information” means (i) the terms and conditions of this Agreement inclusive of but not limited to any other prior confidential agreement whether explicit or implied by terms and relationship of Party with Yexah and its stated or present functions, that is subsisting on the date of this Agreement; (ii) Yexah’s business plans, strategies, methods and/or practices; (iii) any information relating to Yexah or its business that is not generally known to the public, including, but not limited to information about Yexah’s personnel, products, customers, marketing strategies, services or future business plans, and (iv) process information defined as data/test data/reports/studies in­house or contracted/details/quantified steps/process details whether affixed on paper or transferred by way of oral and/or practical instruction with reference to any product which Yexah may own or be associated with.  "
  );
  doc.moveDown(1.0);
  doc.addPage();
  doc
    .font("Helvetica-Bold")
    .text("1.1.6  ")
    .text("Dashboard", { continued: true }).
fontSize(10).text("means a tab available on the Client’s Account on the Platform. ");
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("1.1.7  ")
    .text("Disclosing Party", { continued: true }).
  fontSize(10).text(" means the term as defined in Clause 5.1 of the Agreement.");
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("1.1.8  ")
    .text("Force Majeure Event", { continued: true }).
  fontSize(10).text(
    "shall mean and include the following events, where such events impact the ability of either Party to fulfill their obligations under this Agreement, which includes wars, hostilities, acts of sabotage, revolutions, insurrection, riots, embargoes, government actions, fire, earthquakes, storms, lightning, floods, epidemics, pandemic, strikes, lock-outs, lock down imposed by the government or other acts of God beyond the reasonable control of a Party. "
  );
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("1.1.9  ")
    .text("Indemnified Party", { continued: true }).
  fontSize(10).text(" means the term as defined in Clause 7.1 of the Agreement.");
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("1.1.10  ")
    .text("Indemnifying Party", { continued: true }).
  fontSize(10).text("means the term as defined in Clause 7.1 of the Agreement.");
  doc.moveDown(1.0);
  doc.font("Helvetica-Bold").text("1.1.11  ").text("Losses", { continued: true }).
  fontSize(10).text(
    " shall mean obligations, losses, damages, penalties, claims, actions, causes of action, suits, judgments, settlements, out-of-pocket costs, expenses, and disbursements (including, but not limited to, reasonable costs of investigation, and reasonable attorneys’, accountants’ and expert witnesses’ fees) of whatever kind and nature arising by reason of any act, omission, matter, or event relating to this Agreement, or arising out of any default or breach thereof."
  );
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("1.1.12  ")
    .text("Payment Terms", { continued: true }).
  fontSize(10).text("means the term as defined in Clause 3.1 of the Agreement.");
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("1.1.13  ")
    .text("Privacy Policy", { continued: true }).
  fontSize(10).text(
    "means the privacy policy available on the website of Yexah at http://www.yexah.com/privacypolicy.   "
  );
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("1.1.14  ")
    .text("Receiving Party", { continued: true }).
  fontSize(10).text(" means the term as defined in Clause 5.1 of the Agreement.");
  doc.moveDown(1.0);
  doc.font("Helvetica-Bold").text("1.1.15  ").text("Term", { continued: true })
  .fontSize(10).text("means the term as defined in Clause 9.1 of the Agreement.");
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("1.1.16  ")
    .text("Terms of use", { continued: true }).
  fontSize(10).text(
    " means the terms of use available on the website of Yexah at http://www.yexah.com/termsofuse"
  );
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("1.1.17  ")
    .text("Third-Party Offering(s)", { continued: true }).
  fontSize(10).text("means the term as defined in Clause 7.1 of the Agreement.");
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("1.1.18  ")
    .text("Third-Party Sevice Provider", { continued: true }).
  fontSize(10).text(
    "means a merchant listed on the Platform from whom the Client has Availed Third-Party Offering(s)."
  );
  doc.moveDown(1.0);

  //Clause 2
  doc
    .font("Helvetica-Bold")
    .text("1.2  ")
    .text("Interpretation:",  { continued: true }).
  fontSize(10).text(
    "In this Agreement (including in the recitals above and the schedules hereto), except where the context otherwise requires, the terms set out below shall have the following meaning:"
  );
  // for new oage
  doc.addPage();
  doc
    .text("1.2.1  ")
    .text(
      "the headings are inserted for ease of reference only and shall not affect the construction or interpretation of this Agreement;"
    );
  doc.moveDown(0.5);
  doc
    .text("1.2.2  ")
    .text(
      "any reference to any enactment, rule, regulation, notification, the circular or statutory provision is a reference to it as it may have been, or may from time to time be, amended, modified, consolidated, or re-enacted (with or without modification) and includes all instruments or orders made under such enactment; "
    );
  doc.moveDown(0.5);
  doc
    .text("1.2.3  ")
    .text("words in the singular shall include the plural and vice versa;");
  doc.moveDown(0.5);
  doc
    .text("1.2.4  ")
    .text(
      "any reference to Clause or Schedule shall be deemed to be a reference to a Clause or Schedule of this Agreement;"
    );
  doc.moveDown(0.5);
  doc
    .text("1.2.5  ")
    .text(
      "the terms “hereof”, “herein”, “hereto”, “hereunder” or similar expressions used in this Agreement mean and refer to this Agreement and not to any particular Clause of this Agreement;"
    );
  doc.moveDown(0.5);
  doc
    .text("1.2.6  ")
    .text(
      "wherever the word “include,” “includes,” or “including” is used in this Agreement, it shall be deemed to be followed by the words “without limitation”;"
    );
  doc.moveDown(0.5);
  doc
    .text("1.2.7  ")
    .text(
      "references to an “agreement” or “document” shall be construed as a reference to such agreement or document as the same may have been amended, varied, supplemented, or novated in writing at the relevant time in accordance with the requirements of such agreement or document and, if applicable, of this Agreement with respect to amendments;"
    );
  doc.moveDown(0.5);
  doc
    .text("1.2.8  ")
    .text(
      "reference to statutory provisions shall be construed as meaning and including references also to any amendment or re-enactment (whether before or after the Effective Date) for the time being in force and to all statutory instruments or orders made pursuant to such statutory provisions;"
    );
  doc.moveDown(0.5);
  doc
    .text("1.2.9  ")
    .text(
      "the recitals and schedules form an integral part of this Agreement; and"
    );
  doc.moveDown("0.5");
  doc
    .text("1.2.10  ")
    .text(
      "time is of the essence in the performance of the respective Party’s obligations under the terms of this Agreement. If any time period specified herein is extended, then such extended time shall also be construed to be of the essence. "
    );
  doc.moveDown(0.5);
  doc
    .font("Helvetica-Bold")
    .text("2" , {continued:true})
    .text("TERMS AND CONDITIONS", { underline: true });
  doc.moveDown(1.5);
  doc
    .text("2.1  ")
    .text(
      "Client through the Platform may select,  place a request and select a price point for any Third-Party Offering(s) as available on the Platform."
    );
  doc.moveDown(0.5);
  doc
    .text("2.2  ")
    .text(
      "Third-Party Service Provider shall provide either an acceptance or rejection of such request to the Client within [7 days] from the receipt of such request. "
    );
  doc.moveDown(0.5);

  // for new oage
  doc.addPage();
  doc
    .text("2.3  ")
    .text(
      "The terms and conditions under this Agreement shall be applicable to the Parties once Third-Party Service Provider accepts the Client’s request as provided in Clause 2.1 in relation to the Third-Party Offerings (“Availed Third-Party Offerings”)."
    );
  doc.moveDown(0.5);
  doc
    .text("2.4  ")
    .text(
      "Client shall make the payment to Yexah for the Availed Third-Party Offering(s) in accordance with Clause 3 of the Agreement, provided hereinbelow."
    );
  doc.moveDown(0.5);
  doc
    .font("Helvetica-Bold")
    .text("3")
    .text("PAYMENT AND REFUND TERMS }", { underline: true });
  doc.moveDown(1.5);
  doc
    .text("3.1  ")
    .text(
      "Client shall pay Yexah for the Availed Third-Party Offering(s) in accordance with the payment terms agreed between the Third Party Service Provider and the Client basis the payment terms provided in Annexure A of the Agreement (“Payment Terms”)."
    );
  doc.moveDown(1.0);
  doc
    .text("3.2  ")
    .text(
      "In scenarios where, Client raises a refund request in relation to the Availed Third-Party Offering(s) or to be availed Third Party Offering(s), the same shall be in accordance with the refund provisions provided in the Payment Terms."
    );
  doc.moveDown("1.0");
  doc
    .text("3.3  ")
    .text(
      "Once the refund request is approved by the Third-Party Service Provider as per the Payment Terms, Yexah shall refund the amount to the Client within 30 (thirty) days from such approval."
    );
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("4  " ,{continued:true})
    .text("ACKNOWLEDGMENT BY THE CLIENT", { underline: true });
  doc.moveDown(1.5);
  doc
    .text("4.1  ")
    .text(
      "Client agrees and acknowledges, that Yexah is merely an intermediary between the Client and the Third-Party Service Provider(s)."
    );
  doc.moveDown(1.0);
  doc
    .text("4.2  ")
    .text(
      "Client agrees and acknowledges that it/he/she shall comply with Yexah’s Privacy Policy and Terms of Use."
    );
  doc.moveDown(1.0);
  doc
    .text("4.3  ")
    .text(
      "4.3.Client agrees and acknowledges that he/she/it is not a customer to Yexah pursuant to the Availed Third-Party Offering(s) under this Agreement. Further, the Client agrees not to bring any claims against Yexah for any loss or damages that arise or in relation to or in connection with the Availed Third-Party Offering(s)."
    );
  doc.moveDown(1.0);
  doc
    .text("4.3  ")
    .text(
      "4.3.Client agrees and acknowledges that he/she/it is not a customer to Yexah pursuant to the Availed Third-Party Offering(s) under this Agreement. Further, the Client agrees not to bring any claims against Yexah for any loss or damages that arise or in relation to or in connection with the Availed Third-Party Offering(s)."
    );
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("5  " ,{continued:true})
    .text("CONFIDENTIALITY", { underline: true });
  doc.moveDown(1.5);
  doc
    .text("5.1  ")
    .text(
      "The Party disclosing the information (“Disclosing Party”) may from time to time during the Term of this Agreement disclose to the other Party (“Receiving Party”) certain Confidential Information. The Receiving Party shall: (a) keep confidential the Confidential Information and not disclose the same to any third party or use the same for the Receiving Party’s benefit or for the benefit of any third party, except as expressly permitted by the Agreement or except with the prior written consent of the Disclosing Party; (b) protect the Confidential Information received with all reasonable care so as to ensure that the same does not fall into the hands of third parties or is not put to unauthorized use; (c) not reproduce in any form the Confidential Information except with the prior written consent of the Disclosing Party. Further, the Receiving Party shall take steps to immediately notify the Disclosing Party of any infringement or illegal use of the Confidential Information or if it detects or suspects actual or threatened disclosure of any Confidential Information to any unauthorized person in violation of this Clause or if it otherwise detects or suspects that Confidential Information disclosed under this Agreement is likely to be "
    );
  // doc.addPage();
  doc.fontSize(10).text(
    "used other than for the performance of the services or is lost or unaccounted for and also will reasonably co-operate with the Disclosing Party in any investigation of, or action against, unauthorized disclosure and/or misuse of Confidential Information."
  );
  doc.moveDown(1.5);
  doc
    .text("5.2")
    .text(
      "The obligations of confidentiality stipulated in this Clause shall not apply to any information that: (a) was known to any of the Parties prior to its disclosure by the Disclosing Party; or (b) has become generally available to the public (other than by virtue of its disclosure by the other Party); or (c) if required to be disclosed pursuant to the requirements of any Applicable Law or governmental authority; or (d) that is received from a third party, not being the other Party, who has lawfully acquired it and who is under no obligation to restrict its disclosure."
    );
  doc.moveDown(1.0);
  doc
    .text("5.3")
    .text(
      "Confidentiality obligation under Clause 5 shall be read along with the confidentiality obligation provided in the Privacy Policy and Terms of Use. "
    );
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("6")
    .text("REPRESENTATIONS AND WARRANTIES", { underline: true });
  doc.moveDown(1.0);
  doc.fontSize(10).text("6.1").text("Each Party represents and warrants to the other that:");
  doc.moveDown(1.0);
  doc
    .text("6.1.2")
    .text(
      "this Agreement creates a valid legal and binding obligation on the Parties and they are not specifically debarred from entering into this Agreement by any provision of Applicable Laws; and"
    );
  doc.moveDown(1.0);
  doc
    .text("6.1.3")
    .text(
      "this Agreement creates a valid legal and binding obligation on the Parties and they are not specifically debarred from entering into this Agreement by any provision of Applicable Laws; and"
    );
  doc.moveDown(1.0);
  doc
    .text("6.2")
    .text(
      "6.2.Each Party acknowledges that the other Party is entering into this Agreement relying on the representations and warranties contained in this Clause 6."
    );
  doc.moveDown(1.0);
  doc
    .text("6.2")
    .text(
      "6.2.Each Party acknowledges that the other Party is entering into this Agreement relying on the representations and warranties contained in this Clause 6."
    );
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("7")
    .text("INDEMNIFICATION", { underline: true });
  doc.moveDown(1.5);
  doc
    .text("7.1")
    .text(
      "Client (“Indemnifying Party”) hereby undertakes to indemnify, hold harmless and keep Yexah (“Indemnified Party”) indemnified against any Losses, claims, costs and damages, actions, and expenses (excluding legal fees) which are incurred by the Indemnified Party due to:"
    );
  doc.moveDown(1.0);
  doc
    .text("7.1.1")
    .text(
      "breach of the representations and warranties under this Agreement; or"
    );
  doc.moveDown(1.0);
  doc
    .text("7.1.2")
    .text(
      "failure to perform any covenant, obligation, or undertaking under this Agreement; or"
    );
  doc.moveDown(1.0);
  doc
    .text("7.1.3")
    .text("7.1.3.breach or violation of any Applicable Law by the Parties; or");
  doc.moveDown(1.0);
  doc
    .text("7.1.4")
    .text(
      "gross negligence, wilful misconduct or fraud by either of the Party"
    );
  doc.moveDown(1.0);
  // new page
  // doc.addPage();
  doc
    .text("7.2")
    .text(
      "Client agrees and acknowledges that there shall be no indemnification provided by Yexah in relation to any Losses, claims, costs and damages, actions and expenses due to the Availed Third-Party Offering(s)."
    );
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("8")
    .text("DISCLAIMER OF WARRANTY", { underline: true });
  doc.moveDown(1.5);
  doc
    .text("8.1")
    .text(
      "THE THIRD-PARTY OFFERING(S) AND DATA ON THE PLATFORM ARE PROVIDED BY YEXAH ON AN 'AS IS' AND 'AS AVAILABLE' BASIS. YEXAH MAKES NO REPRESENTATIONS OR WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, AS TO THE OPERATION OF THE PLATFORM AND THIRD-PARTY OFFERING(S)."
    );
  doc.moveDown(1.5);
  doc
    .text("8.2")
    .text(
      "NEITHER YEXAH NOR ANY PERSON ASSOCIATED WITH YEXAH MAKES ANY WARRANTY OR REPRESENTATION WITH RESPECT TO THE COMPLETENESS, SECURITY, RELIABILITY, QUALITY, ACCURACY, OR AVAILABILITY OF THE THIRD-PARTY OFFERING(S) ON THE PLATFORM. NEITHER YEXAH NOR ANY PERSON ASSOCIATED WITH THE YEXAH REPRESENTS THAT THE THIRD-PARTY OFFERING(S) ON THE PLATFORM SHALL BE RELIABLE, ERROR-FREE, OR UNINTERRUPTED, DEFECTS-FREE."
    );
  doc.moveDown(1.5);
  doc
    .text("8.3")
    .text(
      "YEXAH HEREBY DISCLAIMS ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF MERCHANTABILITY, NON-INFRINGEMENT, AND FITNESS FOR PARTICULAR PURPOSE. YEXAH SHALL NOT BE LIABLE FOR ANY LOSSES, DAMAGES, OR CLAIMS BY THE CLIENT IN THIS REGARD."
    );
  doc.moveDown(1.5);
  doc
    .font("Helvetica-Bold")
    .text("9")
    .text("TERM AND TERMINATION", { underline: true });
  doc.moveDown(1.5);
  doc
    .text("9.1")
    .text(
      "This Agreement shall be valid for a timeframe prescribed by the Third-Party Service Provider and shall be available on the Platform (“Term”)."
    );
  doc.moveDown(1.0);
  doc
    .text("9.2")
    .text(
      "This Agreement shall be valid for a timeframe prescribed by the Third-Party Service Provider and shall be available on the Platform (“Term”)."
    );
  doc.moveDown(1.0);
  doc
    .text("9.3")
    .text(
      "Termination for Cause by Yexah: This Agreement may be terminated by Yexah, immediately: (a) upon breach of any material terms of the Agreement, including, inter alia, breach or non-compliance with the confidentiality provisions of this Agreement, the representations and warranties, as set out herein, by giving a prior written notice of 7 (Seven) days to the Third Party Service Provider to cure or remedy such breach or defect and such breach or defect is not remedied within the aforesaid cure period; (b) if the Client is declared bankrupt or insolvent, assigns all or a substantial part of its business or assets for the benefit of creditors, becomes subject to any legal proceeding relating to insolvency or the protection of creditors’ rights or otherwise ceases to conduct business in the normal course; (c) the Client is in any breach or any non-compliance with, any Applicable Laws in respect of performance provided under this Agreement; and/or (d) the Client carries out or permits to be carried out an illegal or unethical or"
    );
  // doc.addPage();
  doc.fontSize(10).text(
    "illegal activity which would, in the opinion of Yexah, bring Yexah or its goodwill or reputation into bad repute."
  );
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("10")
    .text("MISCELLANEOUS", { underline: true });
  doc.moveDown(1.5);
  doc
    .text("10.1")
    .font("Helvetica-Bold")
    .text("Assignment :", { continued: true })
    .text(
      "Parties shall not be entitled to assign any of its rights, benefits, or obligations under this Agreement without the prior written approval of the other Party."
    );
  doc.moveDown(1.5);
  doc.font("Helvetica-Bold").text("10.2").text("Force Majeure:");
  doc.moveDown(1.5);
  doc
    .text("10.2.1")
    .text(
      "Neither Party shall be considered in default of performance of its obligations under the terms of this Agreement, if such performance is prevented or delayed due to or attributable to or arises out of any Force Majeure Event, provided that notices in writing of any Force Majeure Event is given by the affected Party as soon as possible upon the occurrence of such Force Majeure Event and in any event within 14 (Fourteen) days from the happening of the Force Majeure Event, and in case it is not possible to serve the notice within the said 14 (Fourteen) days period, then within the shortest possible period thereafter without delay."
    );
  doc.moveDown(1.0);
  doc
    .text("10.2.2")
    .text(
      "The affected Party shall continue to perform those obligations under this Agreement, which are not affected by the Force Majeure Event. The affected Party will be excused from further performance or observance of obligation(s) so affected by the Force Majeure Event for as long as such circumstances prevail and such Party continues to use reasonable efforts to recommence performance or observance whenever and to whatever extent possible without delay."
    );
  doc.moveDown(1.0);
  doc
    .text("10.2.3")
    .text(
      "As soon as the cause of Force Majeure has been removed, the Party whose liability to perform its obligation has been affected, shall recommence performance or observance of obligation(s) so affected and shall notify the other Party of the same."
    );
  doc.moveDown(1.0);
  doc
    .text("10.3")
    .font("Helvetica-Bold")
    .text("Governing Law and Jurisdiction:", { continued: true })
    .text(
      "The Agreement shall be governed by and construed in accordance with the laws of India and subject to Clause 10.4 below, the courts at Bangalore, India shall have exclusive jurisdiction on the matters arising from this Agreement, without regard to the principles of conflicts of laws."
    );
  doc.moveDown(1.0);
  doc
    .text("10.4")
    .font("Helvetica-Bold")
    .text("Dispute Resolution:", { continued: true });
  doc.moveDown(1.5);
  doc
    .text("10.4.1")
    .text(
      "In the event any dispute or differences arises in connection with the interpretation, implementation or purported termination of this Agreement as specified above, all such disputes shall be referred to and finally resolved by arbitration in accordance with the provisions of the Arbitration and Conciliation Act, 1996 and under the rules enacted thereunder, including any amendments thereof."
    );
  doc.moveDown(1.0);
  doc
    .text("10.4.2")
    .text(
      "The proceedings of the arbitration shall be conducted in English language. The seat and venue for such arbitration shall be Bangalore. The arbitration award shall be final and binding on the Parties and the Parties agree to be bound thereby and to act accordingly."
    );
  doc.moveDown(1.0);
  // doc.addPage();
  doc
    .text("10.5")
    .font("Helvetica-Bold")
    .text("Severability:", { continued: true })
    .text(
      "If at any time any provision of this Agreement is or becomes illegal, invalid or unenforceable in any respect under the Applicable Laws, the legality, validity and enforceability of such provision under the Applicable Laws, and of the remaining provisions of this Agreement, shall not be affected or impaired thereby."
    );
  doc.moveDown(1.0);
  doc
    .text("10.5")
    .font("Helvetica-Bold")
    .text("Severability:", { continued: true })
    .text(
      "If at any time any provision of this Agreement is or becomes illegal, invalid or unenforceable in any respect under the Applicable Laws, the legality, validity and enforceability of such provision under the Applicable Laws, and of the remaining provisions of this Agreement, shall not be affected or impaired thereby."
    );
  doc.moveDown(1.0);
  doc
    .text("10.6")
    .font("Helvetica-Bold")
    .text("Waiver:", { continued: true })
    .text(
      "Neither this Agreement nor any provision hereof may be waived, modified, amended, discharged or terminated except by an instrument in writing signed by each of the Parties."
    );
  doc.moveDown(1.0);
  doc
    .text("10.7")
    .font("Helvetica-Bold")
    .text("Notices:", { continued: true })
    .text(
      "Any notice or other communication under this Agreement shall be in writing and shall be sent by registered mail, or courier service, addressed to the Party for whom intended at its address set forth below, or to such other address as such Party shall have designated by notice to the other in the manner herein prescribed. Any such notice, etc. shall be deemed given when delivered or refused or when delivery is attempted on a business day."
    );
  doc.moveDown(1.5);
  doc.fontSize(10).text("If to Yexah:");
  doc.moveDown(1.5);
  doc.fontSize(10).text("Attention: Head of Client Services");
  doc.moveDown(1.0);
  doc.fontSize(10).text(
    "Address: 91 Springboard, 1st Floor Gopala Krishna Complex, No 45/3 Residency Road, M G Road Museum Road, Bangalore: 560025"
  );
  doc.moveDown(0.25);
  doc.fontSize(10).text("Email: customersupport@yexah.com");
  doc.moveDown(1.5);
  doc.fontSize(10).text("If to the Client:");
  doc.moveDown(1.5);
  doc.fontSize(10).text("Attention: [●XXXX],");
  doc.moveDown(0.25);
  doc.fontSize(10).text(`Address: ${party2Address},`);
  doc.moveDown(0.25);
  doc.fontSize(10).text(`Email: ${party2Name},`);
  doc.moveDown(1.5);
  doc.fontSize(10).text(
    "Any of the Parties hereto may, from time to time, change their address or representative for receipt of notices provided for in this Agreement by giving to the other not less than 15 (Fifteen) days prior written notice."
  );
  doc.moveDown(1.5);
  doc
    .text("10.8")
    .font("Helvetica-Bold")
    .text("Whole Agreement and Amendment:", { continued: true })
    .text(
      "This Agreement including the annexures constitutes the whole agreement between the Parties in relation to the services and it is expressly declared that no variation hereof shall be effective unless mutually agreed to by the Parties in writing. Parties agree that any amendment in the annexures in relation to the services and the payment schedule, that is mutually agreed between the Parties, shall be construed to be a part of this Agreement."
    );
  // new page
  doc.addPage();
  doc
    .font("Helvetica-Bold")
    .text("IN WITNESS WHEREOF,", { continued: true })
    .text(
      "this Agreement has been executed as of the date first above written."
    );
  doc.moveDown(1.5);
  doc.fontSize(10).text(
    "Any changes in the scope shall only be effected if such change(s) is mutually accepted by both Parties. Such change(s) may entail revising the commercials and timelines, which shall be mutually decided between the Parties."
  );
  doc.moveDown(10.0);
  doc.rect(50, 220, 250, 150).stroke();
doc.rect(300, 220, 250, 150).stroke();
  doc.font("Helvetica").fontSize(10);
  doc.text("Yexah through its authorized signatory", 50, 230, {
    width: 250,
    align: "center",
 });
 doc.text("The Client", 300, 230, { width: 250, align: "left" });
 doc.font("Helvetica").fontSize(10);
doc.text(`Name: ${authSignatoryName}`, 50, 330);
doc.text(`Designation: ${designation}`, 50, 350);

doc.text(`Name:${party2Name} `, 300, 330);
doc.text(`Designation: ${designation} `, 300, 350);
  // doc.fontSize(10).text(`Name:  Sandeep Kannan`);
  // doc.fontSize(10).text(`Email: Sandeep@yexah.com`);
  // doc.fontSize(10).text(`Phone:  9811924373}`);
  // // Add a placeholder for the digital signature
  // doc.fontSize(10).text("Signature: __", { align: "right" });

  // doc.moveDown(1);
  // doc.fontSize(12).text(party2Name, { underline: true });
  // doc.fontSize(10).text(`Name: ${authSignatoryName}`);
  // doc.fontSize(10).text(`Email: ${authSignatoryEmailAddress}`);
  // doc.fontSize(10).text(`Phone: ${authSignatoryPhoneNumber}`);
  // doc.fontSize(10).text(`Phone: ${designation}`);
  // // Add a placeholder for the digital signature
  // doc.fontSize(10).text("Signature: __", { align: "right" });

  // Add the signature image to the PDF
  if (signatureImageData) {
    const signatureImage = Buffer.from(signatureImageData, "base64");
    const x = 350; // Adjust the X-coordinate for placing the signature image
    const y = 295; // Adjust the Y-coordinate for placing the signature image
    const width = 50; // Adjust the width of the signature image
    const height = 30; // Adjust the height of the signature image
    doc.image(signatureImage, x, y, { width, height });
  }
  const timestamp = new Date().toLocaleTimeString();
const datestamp = new Date().toLocaleDateString();
doc.fontSize(10).text(`Time: ${timestamp}`, 50, 400);
doc.fontSize(10).text(`Date: ${datestamp}`, 50, 420);
  // Add the adminsignature image to the PDF
  // if (adminsignatureImageData) {
  //   const signatureImage = Buffer.from(signatureImageData, "base64");
  //   const x = 500; // Adjust the X-coordinate for placing the signature image
  //   const y = 100; // Adjust the Y-coordinate for placing the signature image
  //   const width = 50; // Adjust the width of the signature image
  //   const height = 30; // Adjust the height of the signature image
  //   doc.image(signatureImage, x, y, { width, height });
  // }
  // Continue adding the rest of the PDF content
  // ... (remaining content code here)

  doc.end();

  // Save the generated PDF to a file
  const pdfPath = path.join(__dirname, filePath);
  doc.pipe(fs.createWriteStream(pdfPath));

  // Read the generated PDF file
  const pdfBuffer = fs.readFileSync(pdfPath);

  // Store the generated PDF in the database
  try {
    // Store the generated PDF in the database using Knex
    const updatedRows = await knex("users")
      .where({ id }) // Assuming the primary key is 'id'
      .update({ pdf_finalsignedcontract: pdfBuffer });

    // Check if the update was successful
    if (updatedRows === 1) {
      console.log("PDF data updated in the database.");
    } else {
      console.error("Failed to update PDF data in the database.");
    }

    // Send the generated PDF as a response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=generated_pdf_with_signature.pdf"
    );

    const mailOptions = {
      from: "Yexah@gully2global.com",
      to: authSignatoryEmailAddress, // Replace with recipient's email
      subject: "Your Yexah Contract is Signed and Ready !",
      html: `
        <html>
          <body>
          
            <p>Hi, </p>
            <p>Thank you for curating your API ! We are happy to share the final contract with signatures.</p>
            <p>You can download contract documentation. here. ,</p>
            <p>You can also access the contract from the Yexah platform under Deals section.</p>
            <p>YGo to the Yexah! platform     (text linked to login link) here. ,</p>
            <p>If you have any question, send us an email to support@yexah.com</p>
            <p>Happy developing!</p>
            <p>Kind regards,</p>
            <p>The Yexah Team</p>
          </body>
        </html>
      `,
    
      attachments: [
        {
          filename: "generated_pdf_with_signature.pdf",
          path: pdfPath,
        },
      ],
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }});

    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating Agreement with Signature:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.post("/generateAgreementyexahSignature2", async (req, res) => {
  const {
    id,
    party2Name,
    party2Address,
    party2PAN,
    party2GST,
    authSignatoryName,
    designation,
    authSignatoryEmailAddress,
    authSignatoryPhoneNumber,
    // signatureImageData,
    // adminsignatureImageData, // The signature image data you want to add
  } = req.body;

  const doc = new PDFDocument();
  const filePath = "TechnicalServicesAgreement.pdf";

  // Load the template content and create the rest of the PDF content here
  doc.fontSize(12).text("CLIENT AGREEMENT", { align: "center" });
  doc.moveDown(0.5);
  doc
    .moveTo(100, doc.y + 10)
    .lineTo(500, doc.y + 10)
    .stroke(); // Add a line below the text
  doc.moveDown(1.5);
  doc
    .fontSize(12)
    .text(
      "This CLIENT AGREEMENT (hereinafter referred to as the “Agreement”) is made and entered into on the [●XXXX], (hereinafter referred to as “Effective Date”) by and between: "
    );
 
  doc
    .font("Helvetica-Bold").fontSize(10)
    .text("Yexah Ventures Private Limited", { continued: true }).
  
    
    text(
      " a private limited company incorporated under the Companies Act, 2013, having its registered office at 91 Springboard, 1st Floor Gopala Krishna Complex, No. 45/3 Residency Road, M G Road Museum Road, Bangalore: 560025 (hereinafter referred to as the “Yexah”, which expression shall, unless repugnant to the context or meaning thereof, include its successors and permitted assigns) of the FIRST PART; "
    );
  doc.moveDown(1.0);
  doc.font("Helvetica-Bold").text("AND");
  doc.moveDown(1.0);
  doc
    .fontSize(10)
    .text(
      ` ${party2Name}, located at  ${party2Address}, (hereinafter referred to as the “Client”, which expression shall, unless repugnant to the context or meaning thereof, include its successors and permitted assigns) of the SECOND PART.`
    );
  doc.moveDown(1.0);
  doc
    .fontSize(10)
    .text(
      "Yexah and Client shall hereinafter be individually referred to as “Party” and collectively referred to as “Parties”, as the context may deem fit."
    );
  doc.moveDown(1.0);
  doc.font("Helvetica-Bold").text("WHEREAS:", { align: "Left" });
  doc.moveDown(1.0);
  doc
    .text("1 ", {continued : true}).fontSize(10)
    .text(
      "Yexah is a B2B online web portal, inter alia, engaged in the business of offering curated deals that can be embedded through an easy plug and play API structure."
    );
  doc.moveDown(0.5);
  doc
    .text("2 ",{continued : true}).fontSize(10)
    .text(
      "Client has approached Yexah to access such curated deals offered via Yexah’s single unified platform (“Platform”). Such curated deals availed by the Client shall be listed under Client’s profile on the Platform from time to time."
    );
  doc.moveDown(0.5);
  doc
    .text("3 ",{continued : true}).fontSize(10)
    .text(
      "The Parties are now entering into this Agreement to formalise the terms of the arrangement between the Parties and for regulating the relationship of the Parties, their inter-se rights and obligations with respect to each other as per the terms and conditions mutually agreed and set forth in this Agreement. "
    );
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold").fontSize(12)
    .text(
      " NOW THEREFORE THIS AGREEMENT WITNESSETH AND IT IS AGREED BY AND BETWEEN THE PARTIES AS UNDER: "
    );
    doc.moveDown(0.5);
  doc
    .font("Helvetica-Bold")
    .text("1 ",{continued : true}).fontSize(10)
    .text("DEFINITIONS AND INTERPRETATION", { underline: true });
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("1.1  ").fontSize(10)
    .text("Defination",  { continued: true })
  .fontSize(10).text(
    "As used in this Agreement, the terms and expressions when used with capitalized first letter shall, unless the context otherwise requires, have the meaning assigned to them in this Clause below and all capitalised terms not defined in this Clause shall have the meaning assigned to them in the other parts of this Agreement when defined for use in bold letters enclosed within quotes (“”): "
  );
  // newpage
  doc.addPage();
  doc
  .font("Helvetica-Bold")
  .text("1.1.1  ", { continued: true })
  .fontSize(10)
  .text("Agreement", { continued: true })
  .fontSize(10)
  .text(
    "means this client agreement, as amended in writing from time to time in accordance with the provisions hereof and shall include all the schedules and/or annexures attached to this Agreement. "
  )
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("1.1.2  ",{continued : true})
    .fontSize(10)
    .text("Applicable", { continued: true }).
  fontSize(10)
  .text(
    "means any statute, law, regulation, ordinance, rule, judgment, order, decree, bye-law, approval of any governmental authority, directive, guideline, policy, requirement or other governmental restriction or any similar form of decision of or determination by, or any interpretation or administration having the force of law of any of the foregoing, or which is generally followed, by any governmental authority having jurisdiction, applicable to the Parties, in force, from time to time, wherever the Parties conduct their respective businesses. "
  );
  doc.moveDown(1.0);
  doc.font("Helvetica-Bold").text("1.1.3  ",{continued : true}).fontSize(10).text("Api", { continued: true }).
  fontSize(10).text("means application programming interface. ");
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("1.1.4  ",{continued : true}).fontSize(10)
    .text("Availed third-party offering(s)", { continued: true }).
  fontSize(10).text("means as the term as defined in Clause 2.3 of the Agreement.  ");
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("1.1.5  ")
    .text("Confidential Information", { continued: true }).
  fontSize(10).text(
    "shall mean all non-public, commercially proprietary or sensitive information relating to the development, utility, operation, functionality, performance, cost, present and proposed businesses, formulae, ideas, strategies, techniques, policy, data of the disclosing Party including but not limited to personal information, commercial, technical and artistic information relating to the disclosing Party’s establishment, maintenance, marketing and promotion of its own services, experimental work, customers, financial information, marketing plans, business plans, project plans, information relating to sales, costs, operating income,  software, technology, methods, data, files, or other materials provided by the disclosing Party in any form or medium, tangible or intangible, either orally, in writing or in machine readable form or through visual observation or learnt or accessed by any other means by the receiving Party, whether or not identified as “confidential”  or “proprietary” or similar designation expressly. Confidential Information and obligations thereto shall apply irrespective of the form in or the media on which such information is displayed or contained. The recipient will however be able to use collaterals for branding or marketing purposes only after prior written approval has been provided by the disclosing Party. For avoidance of doubt, the term “Confidential Information” means (i) the terms and conditions of this Agreement inclusive of but not limited to any other prior confidential agreement whether explicit or implied by terms and relationship of Party with Yexah and its stated or present functions, that is subsisting on the date of this Agreement; (ii) Yexah’s business plans, strategies, methods and/or practices; (iii) any information relating to Yexah or its business that is not generally known to the public, including, but not limited to information about Yexah’s personnel, products, customers, marketing strategies, services or future business plans, and (iv) process information defined as data/test data/reports/studies in­house or contracted/details/quantified steps/process details whether affixed on paper or transferred by way of oral and/or practical instruction with reference to any product which Yexah may own or be associated with.  "
  );
  doc.moveDown(1.0);
  doc.addPage();
  doc
    .font("Helvetica-Bold")
    .text("1.1.6  ")
    .text("Dashboard", { continued: true }).
fontSize(10).text("means a tab available on the Client’s Account on the Platform. ");
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("1.1.7  ")
    .text("Disclosing Party", { continued: true }).
  fontSize(10).text(" means the term as defined in Clause 5.1 of the Agreement.");
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("1.1.8  ")
    .text("Force Majeure Event", { continued: true }).
  fontSize(10).text(
    "shall mean and include the following events, where such events impact the ability of either Party to fulfill their obligations under this Agreement, which includes wars, hostilities, acts of sabotage, revolutions, insurrection, riots, embargoes, government actions, fire, earthquakes, storms, lightning, floods, epidemics, pandemic, strikes, lock-outs, lock down imposed by the government or other acts of God beyond the reasonable control of a Party. "
  );
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("1.1.9  ")
    .text("Indemnified Party", { continued: true }).
  fontSize(10).text(" means the term as defined in Clause 7.1 of the Agreement.");
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("1.1.10  ")
    .text("Indemnifying Party", { continued: true }).
  fontSize(10).text("means the term as defined in Clause 7.1 of the Agreement.");
  doc.moveDown(1.0);
  doc.font("Helvetica-Bold").text("1.1.11  ").text("Losses", { continued: true }).
  fontSize(10).text(
    " shall mean obligations, losses, damages, penalties, claims, actions, causes of action, suits, judgments, settlements, out-of-pocket costs, expenses, and disbursements (including, but not limited to, reasonable costs of investigation, and reasonable attorneys’, accountants’ and expert witnesses’ fees) of whatever kind and nature arising by reason of any act, omission, matter, or event relating to this Agreement, or arising out of any default or breach thereof."
  );
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("1.1.12  ")
    .text("Payment Terms", { continued: true }).
  fontSize(10).text("means the term as defined in Clause 3.1 of the Agreement.");
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("1.1.13  ")
    .text("Privacy Policy", { continued: true }).
  fontSize(10).text(
    "means the privacy policy available on the website of Yexah at http://www.yexah.com/privacypolicy.   "
  );
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("1.1.14  ")
    .text("Receiving Party", { continued: true }).
  fontSize(10).text(" means the term as defined in Clause 5.1 of the Agreement.");
  doc.moveDown(1.0);
  doc.font("Helvetica-Bold").text("1.1.15  ").text("Term", { continued: true })
  .fontSize(10).text("means the term as defined in Clause 9.1 of the Agreement.");
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("1.1.16  ")
    .text("Terms of use", { continued: true }).
  fontSize(10).text(
    " means the terms of use available on the website of Yexah at http://www.yexah.com/termsofuse"
  );
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("1.1.17  ")
    .text("Third-Party Offering(s)", { continued: true }).
  fontSize(10).text("means the term as defined in Clause 7.1 of the Agreement.");
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("1.1.18  ")
    .text("Third-Party Sevice Provider", { continued: true }).
  fontSize(10).text(
    "means a merchant listed on the Platform from whom the Client has Availed Third-Party Offering(s)."
  );
  doc.moveDown(1.0);

  //Clause 2
  doc
    .font("Helvetica-Bold")
    .text("1.2  ")
    .text("Interpretation:",  { continued: true }).
  fontSize(10).text(
    "In this Agreement (including in the recitals above and the schedules hereto), except where the context otherwise requires, the terms set out below shall have the following meaning:"
  );
  // for new oage
  doc.addPage();
  doc
    .text("1.2.1  ")
    .text(
      "the headings are inserted for ease of reference only and shall not affect the construction or interpretation of this Agreement;"
    );
  doc.moveDown(0.5);
  doc
    .text("1.2.2  ")
    .text(
      "any reference to any enactment, rule, regulation, notification, the circular or statutory provision is a reference to it as it may have been, or may from time to time be, amended, modified, consolidated, or re-enacted (with or without modification) and includes all instruments or orders made under such enactment; "
    );
  doc.moveDown(0.5);
  doc
    .text("1.2.3  ")
    .text("words in the singular shall include the plural and vice versa;");
  doc.moveDown(0.5);
  doc
    .text("1.2.4  ")
    .text(
      "any reference to Clause or Schedule shall be deemed to be a reference to a Clause or Schedule of this Agreement;"
    );
  doc.moveDown(0.5);
  doc
    .text("1.2.5  ")
    .text(
      "the terms “hereof”, “herein”, “hereto”, “hereunder” or similar expressions used in this Agreement mean and refer to this Agreement and not to any particular Clause of this Agreement;"
    );
  doc.moveDown(0.5);
  doc
    .text("1.2.6  ")
    .text(
      "wherever the word “include,” “includes,” or “including” is used in this Agreement, it shall be deemed to be followed by the words “without limitation”;"
    );
  doc.moveDown(0.5);
  doc
    .text("1.2.7  ")
    .text(
      "references to an “agreement” or “document” shall be construed as a reference to such agreement or document as the same may have been amended, varied, supplemented, or novated in writing at the relevant time in accordance with the requirements of such agreement or document and, if applicable, of this Agreement with respect to amendments;"
    );
  doc.moveDown(0.5);
  doc
    .text("1.2.8  ")
    .text(
      "reference to statutory provisions shall be construed as meaning and including references also to any amendment or re-enactment (whether before or after the Effective Date) for the time being in force and to all statutory instruments or orders made pursuant to such statutory provisions;"
    );
  doc.moveDown(0.5);
  doc
    .text("1.2.9  ")
    .text(
      "the recitals and schedules form an integral part of this Agreement; and"
    );
  doc.moveDown("0.5");
  doc
    .text("1.2.10  ")
    .text(
      "time is of the essence in the performance of the respective Party’s obligations under the terms of this Agreement. If any time period specified herein is extended, then such extended time shall also be construed to be of the essence. "
    );
  doc.moveDown(0.5);
  doc
    .font("Helvetica-Bold")
    .text("2" , {continued:true})
    .text("TERMS AND CONDITIONS", { underline: true });
  doc.moveDown(1.5);
  doc
    .text("2.1  ")
    .text(
      "Client through the Platform may select,  place a request and select a price point for any Third-Party Offering(s) as available on the Platform."
    );
  doc.moveDown(0.5);
  doc
    .text("2.2  ")
    .text(
      "Third-Party Service Provider shall provide either an acceptance or rejection of such request to the Client within [7 days] from the receipt of such request. "
    );
  doc.moveDown(0.5);

  // for new oage
  doc.addPage();
  doc
    .text("2.3  ")
    .text(
      "The terms and conditions under this Agreement shall be applicable to the Parties once Third-Party Service Provider accepts the Client’s request as provided in Clause 2.1 in relation to the Third-Party Offerings (“Availed Third-Party Offerings”)."
    );
  doc.moveDown(0.5);
  doc
    .text("2.4  ")
    .text(
      "Client shall make the payment to Yexah for the Availed Third-Party Offering(s) in accordance with Clause 3 of the Agreement, provided hereinbelow."
    );
  doc.moveDown(0.5);
  doc
    .font("Helvetica-Bold")
    .text("3")
    .text("PAYMENT AND REFUND TERMS }", { underline: true });
  doc.moveDown(1.5);
  doc
    .text("3.1  ")
    .text(
      "Client shall pay Yexah for the Availed Third-Party Offering(s) in accordance with the payment terms agreed between the Third Party Service Provider and the Client basis the payment terms provided in Annexure A of the Agreement (“Payment Terms”)."
    );
  doc.moveDown(1.0);
  doc
    .text("3.2  ")
    .text(
      "In scenarios where, Client raises a refund request in relation to the Availed Third-Party Offering(s) or to be availed Third Party Offering(s), the same shall be in accordance with the refund provisions provided in the Payment Terms."
    );
  doc.moveDown("1.0");
  doc
    .text("3.3  ")
    .text(
      "Once the refund request is approved by the Third-Party Service Provider as per the Payment Terms, Yexah shall refund the amount to the Client within 30 (thirty) days from such approval."
    );
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("4  " ,{continued:true})
    .text("ACKNOWLEDGMENT BY THE CLIENT", { underline: true });
  doc.moveDown(1.5);
  doc
    .text("4.1  ")
    .text(
      "Client agrees and acknowledges, that Yexah is merely an intermediary between the Client and the Third-Party Service Provider(s)."
    );
  doc.moveDown(1.0);
  doc
    .text("4.2  ")
    .text(
      "Client agrees and acknowledges that it/he/she shall comply with Yexah’s Privacy Policy and Terms of Use."
    );
  doc.moveDown(1.0);
  doc
    .text("4.3  ")
    .text(
      "4.3.Client agrees and acknowledges that he/she/it is not a customer to Yexah pursuant to the Availed Third-Party Offering(s) under this Agreement. Further, the Client agrees not to bring any claims against Yexah for any loss or damages that arise or in relation to or in connection with the Availed Third-Party Offering(s)."
    );
  doc.moveDown(1.0);
  doc
    .text("4.3  ")
    .text(
      "4.3.Client agrees and acknowledges that he/she/it is not a customer to Yexah pursuant to the Availed Third-Party Offering(s) under this Agreement. Further, the Client agrees not to bring any claims against Yexah for any loss or damages that arise or in relation to or in connection with the Availed Third-Party Offering(s)."
    );
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("5  " ,{continued:true})
    .text("CONFIDENTIALITY", { underline: true });
  doc.moveDown(1.5);
  doc
    .text("5.1  ")
    .text(
      "The Party disclosing the information (“Disclosing Party”) may from time to time during the Term of this Agreement disclose to the other Party (“Receiving Party”) certain Confidential Information. The Receiving Party shall: (a) keep confidential the Confidential Information and not disclose the same to any third party or use the same for the Receiving Party’s benefit or for the benefit of any third party, except as expressly permitted by the Agreement or except with the prior written consent of the Disclosing Party; (b) protect the Confidential Information received with all reasonable care so as to ensure that the same does not fall into the hands of third parties or is not put to unauthorized use; (c) not reproduce in any form the Confidential Information except with the prior written consent of the Disclosing Party. Further, the Receiving Party shall take steps to immediately notify the Disclosing Party of any infringement or illegal use of the Confidential Information or if it detects or suspects actual or threatened disclosure of any Confidential Information to any unauthorized person in violation of this Clause or if it otherwise detects or suspects that Confidential Information disclosed under this Agreement is likely to be "
    );
  // doc.addPage();
  doc.fontSize(10).text(
    "used other than for the performance of the services or is lost or unaccounted for and also will reasonably co-operate with the Disclosing Party in any investigation of, or action against, unauthorized disclosure and/or misuse of Confidential Information."
  );
  doc.moveDown(1.5);
  doc
    .text("5.2")
    .text(
      "The obligations of confidentiality stipulated in this Clause shall not apply to any information that: (a) was known to any of the Parties prior to its disclosure by the Disclosing Party; or (b) has become generally available to the public (other than by virtue of its disclosure by the other Party); or (c) if required to be disclosed pursuant to the requirements of any Applicable Law or governmental authority; or (d) that is received from a third party, not being the other Party, who has lawfully acquired it and who is under no obligation to restrict its disclosure."
    );
  doc.moveDown(1.0);
  doc
    .text("5.3")
    .text(
      "Confidentiality obligation under Clause 5 shall be read along with the confidentiality obligation provided in the Privacy Policy and Terms of Use. "
    );
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("6")
    .text("REPRESENTATIONS AND WARRANTIES", { underline: true });
  doc.moveDown(1.0);
  doc.fontSize(10).text("6.1").text("Each Party represents and warrants to the other that:");
  doc.moveDown(1.0);
  doc
    .text("6.1.2")
    .text(
      "this Agreement creates a valid legal and binding obligation on the Parties and they are not specifically debarred from entering into this Agreement by any provision of Applicable Laws; and"
    );
  doc.moveDown(1.0);
  doc
    .text("6.1.3")
    .text(
      "this Agreement creates a valid legal and binding obligation on the Parties and they are not specifically debarred from entering into this Agreement by any provision of Applicable Laws; and"
    );
  doc.moveDown(1.0);
  doc
    .text("6.2")
    .text(
      "6.2.Each Party acknowledges that the other Party is entering into this Agreement relying on the representations and warranties contained in this Clause 6."
    );
  doc.moveDown(1.0);
  doc
    .text("6.2")
    .text(
      "6.2.Each Party acknowledges that the other Party is entering into this Agreement relying on the representations and warranties contained in this Clause 6."
    );
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("7")
    .text("INDEMNIFICATION", { underline: true });
  doc.moveDown(1.5);
  doc
    .text("7.1")
    .text(
      "Client (“Indemnifying Party”) hereby undertakes to indemnify, hold harmless and keep Yexah (“Indemnified Party”) indemnified against any Losses, claims, costs and damages, actions, and expenses (excluding legal fees) which are incurred by the Indemnified Party due to:"
    );
  doc.moveDown(1.0);
  doc
    .text("7.1.1")
    .text(
      "breach of the representations and warranties under this Agreement; or"
    );
  doc.moveDown(1.0);
  doc
    .text("7.1.2")
    .text(
      "failure to perform any covenant, obligation, or undertaking under this Agreement; or"
    );
  doc.moveDown(1.0);
  doc
    .text("7.1.3")
    .text("7.1.3.breach or violation of any Applicable Law by the Parties; or");
  doc.moveDown(1.0);
  doc
    .text("7.1.4")
    .text(
      "gross negligence, wilful misconduct or fraud by either of the Party"
    );
  doc.moveDown(1.0);
  // new page
  // doc.addPage();
  doc
    .text("7.2")
    .text(
      "Client agrees and acknowledges that there shall be no indemnification provided by Yexah in relation to any Losses, claims, costs and damages, actions and expenses due to the Availed Third-Party Offering(s)."
    );
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("8")
    .text("DISCLAIMER OF WARRANTY", { underline: true });
  doc.moveDown(1.5);
  doc
    .text("8.1")
    .text(
      "THE THIRD-PARTY OFFERING(S) AND DATA ON THE PLATFORM ARE PROVIDED BY YEXAH ON AN 'AS IS' AND 'AS AVAILABLE' BASIS. YEXAH MAKES NO REPRESENTATIONS OR WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, AS TO THE OPERATION OF THE PLATFORM AND THIRD-PARTY OFFERING(S)."
    );
  doc.moveDown(1.5);
  doc
    .text("8.2")
    .text(
      "NEITHER YEXAH NOR ANY PERSON ASSOCIATED WITH YEXAH MAKES ANY WARRANTY OR REPRESENTATION WITH RESPECT TO THE COMPLETENESS, SECURITY, RELIABILITY, QUALITY, ACCURACY, OR AVAILABILITY OF THE THIRD-PARTY OFFERING(S) ON THE PLATFORM. NEITHER YEXAH NOR ANY PERSON ASSOCIATED WITH THE YEXAH REPRESENTS THAT THE THIRD-PARTY OFFERING(S) ON THE PLATFORM SHALL BE RELIABLE, ERROR-FREE, OR UNINTERRUPTED, DEFECTS-FREE."
    );
  doc.moveDown(1.5);
  doc
    .text("8.3")
    .text(
      "YEXAH HEREBY DISCLAIMS ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF MERCHANTABILITY, NON-INFRINGEMENT, AND FITNESS FOR PARTICULAR PURPOSE. YEXAH SHALL NOT BE LIABLE FOR ANY LOSSES, DAMAGES, OR CLAIMS BY THE CLIENT IN THIS REGARD."
    );
  doc.moveDown(1.5);
  doc
    .font("Helvetica-Bold")
    .text("9")
    .text("TERM AND TERMINATION", { underline: true });
  doc.moveDown(1.5);
  doc
    .text("9.1")
    .text(
      "This Agreement shall be valid for a timeframe prescribed by the Third-Party Service Provider and shall be available on the Platform (“Term”)."
    );
  doc.moveDown(1.0);
  doc
    .text("9.2")
    .text(
      "This Agreement shall be valid for a timeframe prescribed by the Third-Party Service Provider and shall be available on the Platform (“Term”)."
    );
  doc.moveDown(1.0);
  doc
    .text("9.3")
    .text(
      "Termination for Cause by Yexah: This Agreement may be terminated by Yexah, immediately: (a) upon breach of any material terms of the Agreement, including, inter alia, breach or non-compliance with the confidentiality provisions of this Agreement, the representations and warranties, as set out herein, by giving a prior written notice of 7 (Seven) days to the Third Party Service Provider to cure or remedy such breach or defect and such breach or defect is not remedied within the aforesaid cure period; (b) if the Client is declared bankrupt or insolvent, assigns all or a substantial part of its business or assets for the benefit of creditors, becomes subject to any legal proceeding relating to insolvency or the protection of creditors’ rights or otherwise ceases to conduct business in the normal course; (c) the Client is in any breach or any non-compliance with, any Applicable Laws in respect of performance provided under this Agreement; and/or (d) the Client carries out or permits to be carried out an illegal or unethical or"
    );
  // doc.addPage();
  doc.fontSize(10).text(
    "illegal activity which would, in the opinion of Yexah, bring Yexah or its goodwill or reputation into bad repute."
  );
  doc.moveDown(1.0);
  doc
    .font("Helvetica-Bold")
    .text("10")
    .text("MISCELLANEOUS", { underline: true });
  doc.moveDown(1.5);
  doc
    .text("10.1")
    .font("Helvetica-Bold")
    .text("Assignment :", { continued: true })
    .text(
      "Parties shall not be entitled to assign any of its rights, benefits, or obligations under this Agreement without the prior written approval of the other Party."
    );
  doc.moveDown(1.5);
  doc.font("Helvetica-Bold").text("10.2").text("Force Majeure:");
  doc.moveDown(1.5);
  doc
    .text("10.2.1")
    .text(
      "Neither Party shall be considered in default of performance of its obligations under the terms of this Agreement, if such performance is prevented or delayed due to or attributable to or arises out of any Force Majeure Event, provided that notices in writing of any Force Majeure Event is given by the affected Party as soon as possible upon the occurrence of such Force Majeure Event and in any event within 14 (Fourteen) days from the happening of the Force Majeure Event, and in case it is not possible to serve the notice within the said 14 (Fourteen) days period, then within the shortest possible period thereafter without delay."
    );
  doc.moveDown(1.0);
  doc
    .text("10.2.2")
    .text(
      "The affected Party shall continue to perform those obligations under this Agreement, which are not affected by the Force Majeure Event. The affected Party will be excused from further performance or observance of obligation(s) so affected by the Force Majeure Event for as long as such circumstances prevail and such Party continues to use reasonable efforts to recommence performance or observance whenever and to whatever extent possible without delay."
    );
  doc.moveDown(1.0);
  doc
    .text("10.2.3")
    .text(
      "As soon as the cause of Force Majeure has been removed, the Party whose liability to perform its obligation has been affected, shall recommence performance or observance of obligation(s) so affected and shall notify the other Party of the same."
    );
  doc.moveDown(1.0);
  doc
    .text("10.3")
    .font("Helvetica-Bold")
    .text("Governing Law and Jurisdiction:", { continued: true })
    .text(
      "The Agreement shall be governed by and construed in accordance with the laws of India and subject to Clause 10.4 below, the courts at Bangalore, India shall have exclusive jurisdiction on the matters arising from this Agreement, without regard to the principles of conflicts of laws."
    );
  doc.moveDown(1.0);
  doc
    .text("10.4")
    .font("Helvetica-Bold")
    .text("Dispute Resolution:", { continued: true });
  doc.moveDown(1.5);
  doc
    .text("10.4.1")
    .text(
      "In the event any dispute or differences arises in connection with the interpretation, implementation or purported termination of this Agreement as specified above, all such disputes shall be referred to and finally resolved by arbitration in accordance with the provisions of the Arbitration and Conciliation Act, 1996 and under the rules enacted thereunder, including any amendments thereof."
    );
  doc.moveDown(1.0);
  doc
    .text("10.4.2")
    .text(
      "The proceedings of the arbitration shall be conducted in English language. The seat and venue for such arbitration shall be Bangalore. The arbitration award shall be final and binding on the Parties and the Parties agree to be bound thereby and to act accordingly."
    );
  doc.moveDown(1.0);
  // doc.addPage();
  doc
    .text("10.5")
    .font("Helvetica-Bold")
    .text("Severability:", { continued: true })
    .text(
      "If at any time any provision of this Agreement is or becomes illegal, invalid or unenforceable in any respect under the Applicable Laws, the legality, validity and enforceability of such provision under the Applicable Laws, and of the remaining provisions of this Agreement, shall not be affected or impaired thereby."
    );
  doc.moveDown(1.0);
  doc
    .text("10.5")
    .font("Helvetica-Bold")
    .text("Severability:", { continued: true })
    .text(
      "If at any time any provision of this Agreement is or becomes illegal, invalid or unenforceable in any respect under the Applicable Laws, the legality, validity and enforceability of such provision under the Applicable Laws, and of the remaining provisions of this Agreement, shall not be affected or impaired thereby."
    );
  doc.moveDown(1.0);
  doc
    .text("10.6")
    .font("Helvetica-Bold")
    .text("Waiver:", { continued: true })
    .text(
      "Neither this Agreement nor any provision hereof may be waived, modified, amended, discharged or terminated except by an instrument in writing signed by each of the Parties."
    );
  doc.moveDown(1.0);
  doc
    .text("10.7")
    .font("Helvetica-Bold")
    .text("Notices:", { continued: true })
    .text(
      "Any notice or other communication under this Agreement shall be in writing and shall be sent by registered mail, or courier service, addressed to the Party for whom intended at its address set forth below, or to such other address as such Party shall have designated by notice to the other in the manner herein prescribed. Any such notice, etc. shall be deemed given when delivered or refused or when delivery is attempted on a business day."
    );
  doc.moveDown(1.5);
  doc.fontSize(10).text("If to Yexah:");
  doc.moveDown(1.5);
  doc.fontSize(10).text("Attention: Head of Client Services");
  doc.moveDown(1.0);
  doc.fontSize(10).text(
    "Address: 91 Springboard, 1st Floor Gopala Krishna Complex, No 45/3 Residency Road, M G Road Museum Road, Bangalore: 560025"
  );
  doc.moveDown(0.25);
  doc.fontSize(10).text("Email: customersupport@yexah.com");
  doc.moveDown(1.5);
  doc.fontSize(10).text("If to the Client:");
  doc.moveDown(1.5);
  doc.fontSize(10).text("Attention: [●XXXX],");
  doc.moveDown(0.25);
  doc.fontSize(10).text(`Address: ${party2Address},`);
  doc.moveDown(0.25);
  doc.fontSize(10).text(`Email: ${party2Name},`);
  doc.moveDown(1.5);
  doc.fontSize(10).text(
    "Any of the Parties hereto may, from time to time, change their address or representative for receipt of notices provided for in this Agreement by giving to the other not less than 15 (Fifteen) days prior written notice."
  );
  doc.moveDown(1.5);
  doc
    .text("10.8")
    .font("Helvetica-Bold")
    .text("Whole Agreement and Amendment:", { continued: true })
    .text(
      "This Agreement including the annexures constitutes the whole agreement between the Parties in relation to the services and it is expressly declared that no variation hereof shall be effective unless mutually agreed to by the Parties in writing. Parties agree that any amendment in the annexures in relation to the services and the payment schedule, that is mutually agreed between the Parties, shall be construed to be a part of this Agreement."
    );
  // new page
  doc.addPage();
  doc
    .font("Helvetica-Bold")
    .text("IN WITNESS WHEREOF,", { continued: true })
    .text(
      "this Agreement has been executed as of the date first above written."
    );
  doc.moveDown(1.5);
  doc.fontSize(10).text(
    "Any changes in the scope shall only be effected if such change(s) is mutually accepted by both Parties. Such change(s) may entail revising the commercials and timelines, which shall be mutually decided between the Parties."
  );
  doc.moveDown(10.0);
  doc.rect(50, 220, 250, 150).stroke();
doc.rect(300, 220, 250, 150).stroke();
  doc.font("Helvetica").fontSize(10);
  doc.text("Yexah through its authorized signatory", 50, 230, {
    width: 250,
    align: "center",
 });
 doc.text("The Client", 300, 230, { width: 250, align: "left" });
 doc.font("Helvetica").fontSize(10);
doc.text(`Name: ${authSignatoryName}`, 50, 330);
doc.text(`Designation: ${designation}`, 50, 350);

doc.text(`Name:${party2Name} `, 300, 330);
doc.text(`Designation: ${designation} `, 300, 350);
doc.moveDown(2.0)
const timestamp = new Date().toLocaleTimeString();
const datestamp = new Date().toLocaleDateString();
doc.moveDown(2.0)
doc.fontSize(10).text(`Date: ${datestamp}`, 50, 400);
doc.fontSize(10).text(`Time: ${timestamp}`, 50, 420);
  // doc.fontSize(10).text(`Name:  Sandeep Kannan`);
  // doc.fontSize(10).text(`Email: Sandeep@yexah.com`);
  // doc.fontSize(10).text(`Phone:  9811924373}`);
  // // Add a placeholder for the digital signature
  // doc.fontSize(10).text("Signature: __", { align: "right" });

  // doc.moveDown(1);
  // doc.fontSize(12).text(party2Name, { underline: true });
  // doc.fontSize(10).text(`Name: ${authSignatoryName}`);
  // doc.fontSize(10).text(`Email: ${authSignatoryEmailAddress}`);
  // doc.fontSize(10).text(`Phone: ${authSignatoryPhoneNumber}`);
  // doc.fontSize(10).text(`Phone: ${designation}`);
  // // Add a placeholder for the digital signature
  // doc.fontSize(10).text("Signature: __", { align: "right" });

  // Add the signature image to the PDF
  // if (signatureImageData) {
  //   const signatureImage = Buffer.from(signatureImageData, "base64");
  //   const x = 500; // Adjust the X-coordinate for placing the signature image
  //   const y = 145; // Adjust the Y-coordinate for placing the signature image
  //   const width = 50; // Adjust the width of the signature image
  //   const height = 30; // Adjust the height of the signature image
  //   doc.image(signatureImage, x, y, { width, height });
  // }
  // Add the adminsignature image to the PDF
  // if (adminsignatureImageData) {
  //   const signatureImage = Buffer.from(signatureImageData, "base64");
  //   const x = 500; // Adjust the X-coordinate for placing the signature image
  //   const y = 100; // Adjust the Y-coordinate for placing the signature image
  //   const width = 50; // Adjust the width of the signature image
  //   const height = 30; // Adjust the height of the signature image
  //   doc.image(signatureImage, x, y, { width, height });
  // }
  // Continue adding the rest of the PDF content
  // ... (remaining content code here)

 

  doc.end();

  // Save the generated PDF to a file
  const pdfPath = path.join(__dirname, filePath);
  doc.pipe(fs.createWriteStream(pdfPath));

  // Read the generated PDF file
  const pdfBuffer = fs.readFileSync(pdfPath);

  // Store the generated PDF in the database
  try {
    // Store the generated PDF in the database using Knex
    const updatedRows = await knex("users")
      .where({ id }) // Assuming the primary key is 'id'
      .update({ pdf_signedcontract: pdfBuffer });

    // Check if the update was successful
    if (updatedRows === 1) {
      console.log("PDF data updated in the database.");
    } else {
      console.error("Failed to update PDF data in the database.");
    }

    // Send the generated PDF as a response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=generated_pdf.pdf"
    );

    const mailOptions = {
      from: "Yexah@gully2global.com",
      to: authSignatoryEmailAddress, // Replace with recipient's email
      subject: "Your Yexah Contract is Signed and Ready !",
      html: `
        <html>
          <body>
          
            <p>Hi,</p>
            <p>Thank you for curating your API ! We are happy to share the final contract with signatures.</p>
            <p>You can download contract documentation. here. ,</p>
            <p>You can also access the contract from the Yexah platform under Deals section.</p>
            <p>YGo to the Yexah! platform     (text linked to login link) here. ,</p>
            <p>If you have any question, send us an email to support@yexah.com</p>
            <p>Happy developing!</p>
            <p>Kind regards,</p>
            <p>The Yexah Team</p>
          </body>
        </html>
      `,
    
      attachments: [
        {
          filename: "generated_pdf_with_signature.pdf",
          path: pdfPath,
        },
      ],
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }});

    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating Agreement with Signature:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// app.post("/generateAgreementyexahSignature", async (req, res) => {
//   const {
//     id,
//     party2Name,
//     party2Address,
//     party2PAN,
//     party2GST,
//     authSignatoryName,
//     designation,
//     authSignatoryEmailAddress,
//     authSignatoryPhoneNumber,
//      signatureImageData,
//     // adminsignatureImageData, // The signature image data you want to add
//   } = req.body;

//   const doc = new PDFDocument();
//   const filePath = "TechnicalServicesAgreementWithSignature.pdf";

//   // Load the template content and create the rest of the PDF content here
//   doc.fontSize(12).text('CLIENT AGREEMENT', { align: 'center' });
//   doc.moveDown(0.5);
//   // doc.lineWidth(1).moveTo(doc.x, doc.y).lineTo(500, doc.y).stroke();
//   doc.moveDown(0.5);
//   doc.fontSize(12).text("This CLIENT AGREEMENT (hereinafter referred to as the “Agreement”) is made and entered into on the [●XXXX], (hereinafter referred to as “Effective Date”) by and between: ");
//   doc.moveDown(0.5);
//   doc.font('Helvetica-Bold').text('Yexah Ventures Private Limited', {continued : true});
//   doc.text(10).text(' a private limited company incorporated under the Companies Act, 2013, having its registered office at 91 Springboard, 1st Floor Gopala Krishna Complex, No. 45/3 Residency Road, M G Road Museum Road, Bangalore: 560025 (hereinafter referred to as the “Yexah”, which expression shall, unless repugnant to the context or meaning thereof, include its successors and permitted assigns) of the FIRST PART; ')
//   doc.moveDown(1.5);
//   doc.font('Helvetica-Bold').text("AND");
//   doc.moveDown(1.5);
//   doc.fontSize(12).text("[●XXXX], located at  [●XXXX], (hereinafter referred to as the “Client”, which expression shall, unless repugnant to the context or meaning thereof, include its successors and permitted assigns) of the SECOND PART.");
//   doc.moveDown(1.0);
//   doc.fontSize(12).text('Yexah and Client shall hereinafter be individually referred to as “Party” and collectively referred to as “Parties”, as the context may deem fit.');
//   doc.moveDown(1.0);
//   doc.font('Helvetica-Bold').text("WHEREAS:", {align:"Left"});
//   doc.moveDown(1.0);
//   doc.text('1').text('Yexah is a B2B online web portal, inter alia, engaged in the business of offering curated deals that can be embedded through an easy plug and play API structure.');
//   doc.moveDown("0.5")
//   doc.text('2').text('Client has approached Yexah to access such curated deals offered via Yexah’s single unified platform (“Platform”). Such curated deals availed by the Client shall be listed under Client’s profile on the Platform from time to time.');
//   doc.moveDown("0.5")
//   doc.text('3').text('3.The Parties are now entering into this Agreement to formalise the terms of the arrangement between the Parties and for regulating the relationship of the Parties, their inter-se rights and obligations with respect to each other as per the terms and conditions mutually agreed and set forth in this Agreement. ');
//   doc.moveDown(1.0);
//   doc.font('Helvetica-Bold').text(" NOW THEREFORE THIS AGREEMENT WITNESSETH AND IT IS AGREED BY AND BETWEEN THE PARTIES AS UNDER: ");
//   doc.font('Helvetica-Bold').text('1').text('1.DEFINITIONS AND INTERPRETATION }', {underline:true});
//   doc.moveDown(1.5);
//   doc.font('Helvetica-Bold').text('Defination',{underline:true} ,{continued : true});
//   doc.text("As used in this Agreement, the terms and expressions when used with capitalized first letter shall, unless the context otherwise requires, have the meaning assigned to them in this Clause below and all capitalised terms not defined in this Clause shall have the meaning assigned to them in the other parts of this Agreement when defined for use in bold letters enclosed within quotes (“”): ");
//   // newpage 
//   doc.addPage();
//     doc.font('Helvetica-Bold').text("1.1.1").text('Agreement',{continued : true});
//     doc.text("means this client agreement, as amended in writing from time to time in accordance with the provisions hereof and shall include all the schedules and/or annexures attached to this Agreement. ");
// doc.moveDown(1.0)
// doc.font('Helvetica-Bold').text("1.1.2").text('Applicable',{continued : true});
// doc.text("means any statute, law, regulation, ordinance, rule, judgment, order, decree, bye-law, approval of any governmental authority, directive, guideline, policy, requirement or other governmental restriction or any similar form of decision of or determination by, or any interpretation or administration having the force of law of any of the foregoing, or which is generally followed, by any governmental authority having jurisdiction, applicable to the Parties, in force, from time to time, wherever the Parties conduct their respective businesses. ");
// doc.moveDown(1.0)
// doc.font('Helvetica-Bold').text("1.1.3").text('Api',{continued : true});
// doc.text("means application programming interface. ");
// doc.moveDown(1.0)
// doc.font('Helvetica-Bold').text("1.1.4").text('Availed third-party offering(s)',{continued : true});
// doc.text("means as the term as defined in Clause 2.3 of the Agreement.  ");
// doc.moveDown(1.0)
// doc.font('Helvetica-Bold').text("1.1.5").text('Confidential Information',{continued : true});
// doc.text("1.1.5.shall mean all non-public, commercially proprietary or sensitive information relating to the development, utility, operation, functionality, performance, cost, present and proposed businesses, formulae, ideas, strategies, techniques, policy, data of the disclosing Party including but not limited to personal information, commercial, technical and artistic information relating to the disclosing Party’s establishment, maintenance, marketing and promotion of its own services, experimental work, customers, financial information, marketing plans, business plans, project plans, information relating to sales, costs, operating income,  software, technology, methods, data, files, or other materials provided by the disclosing Party in any form or medium, tangible or intangible, either orally, in writing or in machine readable form or through visual observation or learnt or accessed by any other means by the receiving Party, whether or not identified as “confidential”  or “proprietary” or similar designation expressly. Confidential Information and obligations thereto shall apply irrespective of the form in or the media on which such information is displayed or contained. The recipient will however be able to use collaterals for branding or marketing purposes only after prior written approval has been provided by the disclosing Party. For avoidance of doubt, the term “Confidential Information” means (i) the terms and conditions of this Agreement inclusive of but not limited to any other prior confidential agreement whether explicit or implied by terms and relationship of Party with Yexah and its stated or present functions, that is subsisting on the date of this Agreement; (ii) Yexah’s business plans, strategies, methods and/or practices; (iii) any information relating to Yexah or its business that is not generally known to the public, including, but not limited to information about Yexah’s personnel, products, customers, marketing strategies, services or future business plans, and (iv) process information defined as data/test data/reports/studies in­house or contracted/details/quantified steps/process details whether affixed on paper or transferred by way of oral and/or practical instruction with reference to any product which Yexah may own or be associated with.  ");
// doc.moveDown(1.0)
// doc.addPage();
// doc.font('Helvetica-Bold').text("1.1.6").text('Dashboard',{continued : true});
// doc.text("means a tab available on the Client’s Account on the Platform. ");
// doc.moveDown(1.0)
// doc.font('Helvetica-Bold').text("1.1.7").text('Disclosing Party',{continued : true});
// doc.text(" means the term as defined in Clause 5.1 of the Agreement.");
// doc.moveDown(1.0)
// doc.font('Helvetica-Bold').text("1.1.8").text('Force Majeure Event',{continued : true});
// doc.text("shall mean and include the following events, where such events impact the ability of either Party to fulfill their obligations under this Agreement, which includes wars, hostilities, acts of sabotage, revolutions, insurrection, riots, embargoes, government actions, fire, earthquakes, storms, lightning, floods, epidemics, pandemic, strikes, lock-outs, lock down imposed by the government or other acts of God beyond the reasonable control of a Party. ");
// doc.moveDown(1.0)
// doc.font('Helvetica-Bold').text("1.1.9").text('Indemnified Party',{continued : true});
// doc.text(" means the term as defined in Clause 7.1 of the Agreement.");
// doc.moveDown(1.0)
// doc.font('Helvetica-Bold').text("1.1.10").text('Indemnifying Party',{continued : true});
// doc.text("means the term as defined in Clause 7.1 of the Agreement.");
// doc.moveDown(1.0)
// doc.font('Helvetica-Bold').text("1.1.11").text('Losses',{continued : true});
// doc.text(" shall mean obligations, losses, damages, penalties, claims, actions, causes of action, suits, judgments, settlements, out-of-pocket costs, expenses, and disbursements (including, but not limited to, reasonable costs of investigation, and reasonable attorneys’, accountants’ and expert witnesses’ fees) of whatever kind and nature arising by reason of any act, omission, matter, or event relating to this Agreement, or arising out of any default or breach thereof.");
// doc.moveDown(1.0)
// doc.font('Helvetica-Bold').text("1.1.12").text('Payment Terms',{continued : true});
// doc.text("means the term as defined in Clause 3.1 of the Agreement.");
// doc.moveDown(1.0)
// doc.font('Helvetica-Bold').text("1.1.13").text('Privacy Policy',{continued : true});
// doc.text("means the privacy policy available on the website of Yexah at http://www.yexah.com/privacypolicy.   ");
// doc.moveDown(1.0)
// doc.font('Helvetica-Bold').text("1.1.14").text('Receiving Party',{continued : true});
// doc.text(" means the term as defined in Clause 5.1 of the Agreement.");
// doc.moveDown(1.0)
// doc.font('Helvetica-Bold').text("1.1.15").text('Term',{continued : true});
// doc.text(" 1.1.15.means the term as defined in Clause 9.1 of the Agreement.");
// doc.moveDown(1.0)
// doc.font('Helvetica-Bold').text("1.1.16").text('Terms of use',{continued : true});
// doc.text(" means the terms of use available on the website of Yexah at http://www.yexah.com/termsofuse");
// doc.moveDown(1.0)
// doc.font('Helvetica-Bold').text("1.1.17").text('Third-Party Offering(s)',{continued : true});
// doc.text("means the term as defined in Clause 7.1 of the Agreement.");
// doc.moveDown(1.0)
// doc.font('Helvetica-Bold').text("1.1.18").text('Third-Party Sevice Provider',{continued : true});
// doc.text("means a merchant listed on the Platform from whom the Client has Availed Third-Party Offering(s).");
// doc.moveDown(1.0)

// //Clause 2
// doc.font('Helvetica-Bold').text("2").text('Third-Party Offering(s)',{continued : true});
// doc.text("In this Agreement (including in the recitals above and the schedules hereto), except where the context otherwise requires, the terms set out below shall have the following meaning:")
// // for new oage
// doc.addPage();     






//     // doc.fontSize(10).text(`Name:  Sandeep Kannan`);
//     // doc.fontSize(10).text(`Email: Sandeep@yexah.com`);
//     // doc.fontSize(10).text(`Phone:  9811924373}`);
//     // // Add a placeholder for the digital signature
//     // doc.text("Signature: ____", { align: "right" });
  
//     // doc.moveDown(1);
//     // doc.fontSize(12).text(party2Name, { underline: true });
//     // doc.fontSize(10).text(`Name: ${authSignatoryName}`);
//     // doc.fontSize(10).text(`Email: ${authSignatoryEmailAddress}`);
//     // doc.fontSize(10).text(`Phone: ${authSignatoryPhoneNumber}`);
//     // doc.fontSize(10).text(`Phone: ${designation}`);
//     // // Add a placeholder for the digital signature
//     // doc.text("Signature: ____", { align: "right" });

//   // Add the signature image to the PDF
//   if (signatureImageData) {
//     const signatureImage = Buffer.from(signatureImageData, "base64");
//     const x = 500; // Adjust the X-coordinate for placing the signature image
//     const y = 145; // Adjust the Y-coordinate for placing the signature image
//     const width = 50; // Adjust the width of the signature image
//     const height = 30; // Adjust the height of the signature image
//     doc.image(signatureImage, x, y, { width, height });
//   }
// // Add the adminsignature image to the PDF
// // if (adminsignatureImageData) {
// //   const signatureImage = Buffer.from(signatureImageData, "base64");
// //   const x = 500; // Adjust the X-coordinate for placing the signature image
// //   const y = 100; // Adjust the Y-coordinate for placing the signature image
// //   const width = 50; // Adjust the width of the signature image
// //   const height = 30; // Adjust the height of the signature image
// //   doc.image(signatureImage, x, y, { width, height });
// // }
//   // Continue adding the rest of the PDF content
//   // ... (remaining content code here)

//   doc.end();

//   // Save the generated PDF to a file
//   const pdfPath = path.join(__dirname, filePath);
//   doc.pipe(fs.createWriteStream(pdfPath));

//   // Read the generated PDF file
//   const pdfBuffer = fs.readFileSync(pdfPath);

//   // Store the generated PDF in the database
//   try {
//     // Store the generated PDF in the database using Knex
//     const updatedRows = await knex("users")
//       .where({ id }) // Assuming the primary key is 'id'
//       .update({ pdf_finalsignedcontract: pdfBuffer });

//     // Check if the update was successful
//     if (updatedRows === 1) {
//       console.log("PDF data updated in the database.");
//     } else {
//       console.error("Failed to update PDF data in the database.");
//     }

//     // Send the generated PDF as a response
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       "attachment; filename=generated_pdf_with_signature.pdf"
//     );
//     res.send(pdfBuffer);
//   } catch (error) {
//     console.error("Error generating Agreement with Signature:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
  
// });






app.post('/generatereport', async (req, res) => {
    const {
             user_id,
    providerefno,
    // yexahrefno,
    planstart,
    planvalidity,
    invoicedate,
    invoiced,
    customername,
    email,
    transaction_value
    } = req.body;
  
    const doc = new PDFDocument();
    const filePath = 'TechnicalServicesAgreement.pdf';
  
      // Add a new page to the PDF
      // doc.addPage();
  
      // Define the table headers
      const headers = ['a2zplan id', 'plandetails', 'invoice no.', 'plan no.', 'plan validity', 'device details'];
    
      // Define the table data
      const data = [
        [ 
              user_id,
            providerefno,
            // yexahrefno,
            planstart,
            planvalidity,
            invoicedate,
            invoiced,
            customername,
            email,
            transaction_value
          ],
      ];
    
      doc.fontSize(12).text('<Merchant Logo i.e Your Logo>', {
          align: 'left',
          lineGap: 30,
        });
        doc.fontSize(12).text('Please note the details of your Device Repair plan purchased at <merchant name >', {
            align: 'left',
            lineGap: 15,
          });
          doc.fontSize(12).text('Your plan at A2Z Gadget Repair is confirmed and is linked to your purchase at <merchant name>. Kindly note below the details of your plan', {
              align: 'left',
              lineGap: 5,
            });
      const tableTop = 200; // Y-coordinate for the top of the table
      const lineHeight = 40; // Height of each table row
      const initialLeftMargin = 10; // X-coordinate for the left margin of the table
      const columnWidth = 100; // Width of each table column
    
      // Draw the table headers
      doc.font('Helvetica-Bold');
      headers.forEach((header, index) => {
        doc.text(header, initialLeftMargin + index * columnWidth, tableTop, { width: columnWidth, align: 'left' });
      });
    
      // Draw visible lines for the table headers
      doc.rect(initialLeftMargin, tableTop, headers.length * columnWidth, lineHeight).stroke();
    
      // Draw the table data
      doc.font('Helvetica');
      data.forEach((row, rowIndex) => {
        row.forEach((cell, columnIndex) => {
          const cellTop = tableTop + lineHeight * (rowIndex + 1);
          doc.text(cell, initialLeftMargin + columnIndex * columnWidth, cellTop, {
            width: columnWidth,
            align: 'left',
          });
          // Draw visible lines for the table data
          doc.rect(initialLeftMargin + columnIndex * columnWidth, cellTop, columnWidth, lineHeight).stroke();
        });
      });
    
      // Add a new page for the additional content
      doc.addPage();
    
      doc.fontSize(14).text('Please note the below to access the repair service', {
        align: 'left',
        lineGap: 10,
      });
    
      doc.fontSize(12).text('Service request can be availed via the following channels. You need to share the A2Z plan id (mentioned on page 1 of this customer copy with A2Z on all interactions', {
      //   align: 'left',
        lineGap: 5,
      });
    
      doc.fontSize(12).text(' Website of A2Z (a2ztestfix.test/avail service): book service request using plan id', {
      //   align: 'left',
        lineGap: 10,
      });
    
      doc.fontSize(12).text('Call A2Z customer care: +91-99999999 and follow IVR instructions', {
        align: 'left',
        lineGap: 10,
      });
    
      doc.fontSize(12).text(' Whatsapp A2Z at: +91-483443938 from the same mobile number that is shared by them on your purchase invoice.', {
        align: 'left',
        lineGap: 10,
      });
    
      doc.fontSize(10).text(' Email A2Z at: service@a2ztestdummyapikit.com', {
        align: 'left',
        lineGap: 10,
      });
    
      doc.fontSize(10).text('Please note your contact details registered for the plan:', {
        align: 'left',
        lineGap: 30,
      });
    
      doc.fontSize(10).text(`Name: ${customername} `, {
        align: 'left',
        lineGap: 3,
      });
    
      doc.fontSize(10).text(`Email id: ${email}`, {
        align: 'left',
        lineGap: 3,
      });
    
      doc.fontSize(10).text(`Phone Number: ${transaction_value}`, {
        align: 'left',
        lineGap: 3,
      });
    
      doc.end();
  
    // Save the generated PDF to a file
    const pdfPath = path.join(__dirname, filePath);
    doc.pipe(fs.createWriteStream(pdfPath));
  
    // Read the generated PDF file
    const pdfBuffer = fs.readFileSync(pdfPath);
  
    const transactionId = req.body.id; // Assuming id is provided in the request body
    try {
        await knex('transactions')
            .where('id', user_id)
            .update({ pdf_transaction: pdfBuffer });
  
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=generated_pdf.pdf');
      res.send(pdfBuffer);
    }catch (error) {
      console.error('Error updating PDF data in the database:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  } finally {
      doc.end();
  }
   });
   app.get('/getproviderrefs', async (req, res) => {
    try {
        const providerRefs = await knex('providerref').select('*');
        res.json(providerRefs);
    } catch (error) {
        console.error('Error fetching provider references:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.get('/getusers', async (req, res) => {
  try {
      const providerRefs = await knex('users').select('*');
      res.json(providerRefs);
  } catch (error) {
      console.error('Error fetching provider references:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/getsignatures', async (req, res) => {
  try {
      const providerRefs = await knex('signatures').select('*');
      res.json(providerRefs);
  } catch (error) {
      console.error('Error fetching provider references:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.post('/approveContract/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    await knex('users')
      .where('id', userId)
      .update('approvedtype', 1);

    res.sendStatus(200);
  } catch (error) {
    console.error('Error updating approval status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/configureContract/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    await knex('users')
      .where('id', userId)
      .update('configuretype', 1);

    res.sendStatus(200);
  } catch (error) {
    console.error('Error updating approval status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/getconfiguredusers', async (req, res) => {
  try {
    const configuredUsers = await knex('users')
      .select('*')
      .where('configuretype', 1);
      
    res.json(configuredUsers);
  } catch (error) {
    console.error('Error fetching configured users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/getconfiguredusersnotapproved', async (req, res) => {
  try {
    const configuredUsers = await knex('users')
      .select('*')
      .where('configuretype', 1)
      .where('approvedtype', 0);
      
    res.json(configuredUsers);
  } catch (error) {
    console.error('Error fetching configured users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/getapprovedconfiguredusers', async (req, res) => {
  try {
    const configuredUsers = await knex('users')
      .select('*')
      .where('configuretype', 1)
      .where('approvedtype', 1);
      
    res.json(configuredUsers);
  } catch (error) {
    console.error('Error fetching configured users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/get_transactions', async (req, res) => {
  try {
   

    // Check if the user exists in the users table
    const transactionsData = await knex('transactions').select('*');
    if (!transactionsData) {
      return res.status(404).json({ success: false, message: 'transaction not found.' });
    }

  

    res.json({ success: true, transactionsData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching transactions data.' });
  }
});


app.post('/send-email', async (req, res) => {
  const { email, text } = req.body;

  if (!email || !text) {
    return res.status(400).json({ error: 'Email and text are required' });
  }

  try {
    const mailOptions = {
      from: 'Yexah@gully2global.com', // Replace with your email address
      to: email, // Use the email parameter as the recipient's email address
      subject: 'Issue from the user',
      text: text,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




// 
app.post('/send-email-new-contract-is-for-approve', async (req, res) => {
  const { email, text } = req.body;

  if (!email || !text) {
    return res.status(400).json({ error: 'Email and text are required' });
  }

  try {
    const mailOptions = {
      from: 'Yexah@gully2global.com', // Replace with your email address
      to: email, // Use the email parameter as the recipient's email address
      subject: 'New Contract is for approval',
      text: text,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/send-email-contract-approved', async (req, res) => {
  const { email, text } = req.body;

  if (!email || !text) {
    return res.status(400).json({ error: 'Email and text are required' });
  }

  try {
    const mailOptions = {
      from: 'Yexah@gully2global.com', // Replace with your email address
      to: email, // Use the email parameter as the recipient's email address
      subject: 'Contract is Approved',
      text: text,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/getusers/:id'  , async (req, res) => {
  const { id } = req.params;

  try {
    const user = await knex('users')
      .select('*')
      .where('id', id)
      .first();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// app.post('/upload-pdf/:userId', upload.single('pdf'), async (req, res) => {
//   const { userId } = req.params;
//   const { filename, path: filePath } = req.file;

//   try {
//     const pdfData = {
//       filename: filename,
//       path: filePath,
//     };

//     await knex('users')
//       .where('id', userId)
//       .update({
//         pdf_signedcontract: JSON.stringify(pdfData),
//       });

//     res.status(200).json({ message: 'PDF uploaded and saved successfully' });
//   } catch (error) {
//     console.error('Error uploading and saving PDF:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

app.post('/upload-pdf/:userId', upload.single('pdf'), async (req, res) => {
  const { userId } = req.params;
  const { filename, path: filePath } = req.file;

  try {
    const pdfData = {
      filename: filename,
      content: fs.readFileSync(filePath), // Read the PDF content
    };

    await knex('users')
      .where('id', userId)
      .update({
        pdf_finalsignedcontract: pdfData.content, // Store PDF content as BLOB
      });

    fs.unlinkSync(filePath); // Delete the temporary file

    res.status(200).json({ message: 'PDF uploaded and saved successfully' });
  } catch (error) {
    console.error('Error uploading and saving PDF:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

// ---------------------------------------


