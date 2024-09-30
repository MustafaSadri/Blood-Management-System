const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const methodOverride = require('method-override');
const session = require('express-session');
const User = require('./models/User');
const Volunteer = require('./models/Volunteer');
const BloodCamp = require('./models/bloodCamp');
const Admin = require('./models/admin');
const BloodStock = require('./models/bloodStock');
const Hospital = require('./models/Hospital');
const AppointedCamp = require('./models/appointedCamp'); // New AppointedCamp schema
const BloodRequest = require('./models/bloodRequest');
const multer = require('multer');  //all below 3 are for user awareness feature
const Awareness = require('./models/Awareness');
const nodemailer = require('nodemailer');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, '/public')));

// Configure session middleware
app.use(session({
    secret: 'your-secret-key', // Replace with your own secret
    resave: false,
    saveUninitialized: true
}));

//email functionaliy
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use the email service you're using
    auth: {
        user: 'your-email@gmail.com', // Your email
        pass: 'your-email-password' // Your email password or app-specific password
    }
});

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/blood-donation');
    console.log('Connected to database');
}

main().catch(err => console.log(err));
  //user awareness feature 
  // Configure multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Directory to save uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Append date to filename
    }
});

const upload = multer({ storage: storage });






// Select user or volunteer route
app.get('/', (req, res) => {
    res.render('index');
});


app.post('/role', (req, res) => {
    const role = req.body.role;
    
    switch (role) {
        case 'user':
            res.redirect('/user/login');
            break;
        case 'volunteer':
            res.redirect('/volunteer/login');
            break;
        case 'admin':
            res.redirect('/admin/login');
            break;
        case 'hospital':
            res.redirect('/hospital/login');
            break;
        default:
            res.redirect('/');
            break;
    }
});

function isAdmin(req, res, next) {
    if (req.session.adminId) {
        return next();
    } else {
        res.redirect('/admin/login');
    }
}
function isHospital(req, res, next) {
    if (req.session.hospitalId) {
        return next();
    } else {
        res.redirect('/hospital/login');
    }
}


// User routes
app.get('/user/login', (req, res) => {
    res.render('user/login');
});

app.get('/user/register', (req, res) => {
    res.render('user/register');
});

app.post('/user/register', async (req, res) => {
    const { username, email, password } = req.body;
    const user = new User({ username, email, password });
    await user.save();
    res.redirect('/user/login');
});

app.post('/user/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (user) {
        req.session.userId = user._id; // Store user ID in session
        res.redirect('/user/dashboard');
    } else {
        res.redirect('/user/login');
    }
});

// User dashboard route
// app.get('/user/dashboard', async (req, res) => {
//     const user = await User.findById(req.session.userId);
//     if (user) {
//         const camps = await BloodCamp.find();
//         const awarenessMessage = await Awareness.findOne().sort({ date: -1 });
//         res.render('user/dashboard', { user, camps , awarenessMessage});
//     } else {
//         res.redirect('/user/login');
//     }
// });
app.get('/user/dashboard', async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (user) {
            const camps = await BloodCamp.find();
            const awarenessMessage = await Awareness.findOne().sort({ createdAt: -1 }); // Sort by createdAt
            // console.log("Awareness Message:", awarenessMessage); // Debugging output
            res.render('user/dashboard', { user, camps, awarenessMessage });
        } else {
            res.redirect('/user/login');
        }
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).send('Internal Server Error');
    }
});


//show list of upcoming camps
app.get('/user/dashboard/camps',async (req,res)=>{
    const user = await User.findById(req.session.userId);
    const camps = await BloodCamp.find();
    res.render('user/camps',{user,camps})
})


// Route to show available blood donation camps
app.get('/user/dashboard/donate', async (req, res) => {
    const user = await User.findById(req.session.userId);
    if (!user) {
        return res.redirect('/user/login');
    }

    try {
        const camps = await BloodCamp.find(); // Fetch all camps from the database
        res.render('user/donate', { user, camps }); // Correct path
    } catch (error) {
        console.error('Error fetching camps:', error);
        res.status(500).send('Error fetching camps');
    }
});

app.post('/user/dashboard/donate/:campId', async (req, res) => {
    const userId = req.session.userId;
    const campId = req.params.campId;

    try {
        const user = await User.findById(userId);
        const camp = await BloodCamp.findById(campId);

        if (!user) {
            return res.redirect('/user/login'); // Redirect if the user is not found
        }

        if (!camp) {
            return res.status(404).send('Camp not found'); // Return an error if the camp is not found
        }

        const alreadyAppointed = await AppointedCamp.findOne({ userId, campId });
        if (!alreadyAppointed) {
            // Create a new appointment record
            const newAppointedCamp = new AppointedCamp({ userId, campId });
            await newAppointedCamp.save();

            // Render success page with success message
            res.render('user/appointmentSuccess', { user, camp, alreadyAppointed: false }); // Pass `alreadyAppointed: false`
        } else {
            // If already appointed, show a message and render the success page
            res.render('user/appointmentSuccess', { user, alreadyAppointed: true }); // Pass `alreadyAppointed: true`
        }
    } catch (error) {
        console.error('Error appointing camp:', error);
        res.status(500).send('Error appointing camp');
    }
});




//show appontments
// Route to show user's appointed camps
app.get('/user/dashboard/appointments', async (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        return res.redirect('/user/login'); // Redirect if the user is not logged in
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.redirect('/user/login'); // Redirect if user not found
        }

        // Fetch appointed camps for the user
        const appointedCamps = await AppointedCamp.find({ userId }).populate('campId');

        res.render('user/appointments', { user, appointedCamps }); // Render the appointments page
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).send('Error fetching appointments');
    }
});
// Route to cancel an appointment
app.post('/user/dashboard/cancel-appointment/:appointmentId', async (req, res) => {
    const userId = req.session.userId;
    const appointmentId = req.params.appointmentId;

    if (!userId) {
        return res.redirect('/user/login'); // Redirect if the user is not logged in
    }

    try {
        // Find and delete the appointment
        const result = await AppointedCamp.findOneAndDelete({ _id: appointmentId, userId });

        if (!result) {
            return res.status(404).send('Appointment not found or you do not have permission to cancel it.');
        }

        // Redirect back to the appointments page with a success message
        res.redirect('/user/dashboard/appointments');
    } catch (error) {
        console.error('Error canceling appointment:', error);
        res.status(500).send('Error canceling appointment');
    }
});








// Volunteer routes
app.get('/volunteer/login', (req, res) => {
    res.render('volunteer/login');
});

// app.get('/volunteer/register', (req, res) => {
//     res.render('volunteer/register');
// });

// app.post('/volunteer/register', async (req, res) => {
//     const { username, email, password } = req.body;
//     const volunteer = new Volunteer({ username, email, password });
//     await volunteer.save();
//     res.redirect('/volunteer/login');
// });

app.post('/volunteer/login', async (req, res) => {
    const { email, password } = req.body;
    const volunteer = await Volunteer.findOne({ email, password });
    if (volunteer) {
        req.session.volunteerId = volunteer._id; // Store volunteer ID in session
        res.redirect('/volunteer/dashboard');
    } else {
        res.redirect('/volunteer/login');
    }
});

// Volunteer dashboard route
app.get('/volunteer/dashboard', async (req, res) => {
    const volunteer = await Volunteer.findById(req.session.volunteerId);
    if (volunteer) {
        res.render('volunteer/dashboard', { volunteer });
    } else {
        res.redirect('/volunteer/login');
    }
});

// Route to display the "Add Blood Camp" page
app.get('/volunteer/add-camp', (req, res) => {
    res.render('volunteer/addCamp');
});

// Route to handle the form submission of new blood camp
app.post('/volunteer/add-camp', async (req, res) => {
    const { name, location, date, description } = req.body;
    const newCamp = new BloodCamp({ name, location, date, description });
    await newCamp.save();
    res.redirect('/volunteer/dashboard'); // Redirect to volunteer dashboard
});
//rote to display blood stock
app.get('/volunteer/show-stock', async (req, res) => {
        const bloodStock = await BloodStock.find();
        res.render('volunteer/bloodStock', { bloodStock });
});
// Route to manage blood stock
app.get('/volunteer/manage-stock', async (req, res) => {
    try {
        const stocks = await BloodStock.find(); // Fetch blood stock from the database
        res.render('volunteer/manageStock', { stocks }); // Render the manage stock view
    } catch (error) {
        console.error('Error fetching blood stock:', error);
        res.status(500).send('Error fetching blood stock');
    }
});
app.post('/volunteer/update-stock/:id', async (req, res) => {
    const stockId = req.params.id;
    const { quantity } = req.body;

    try {
        // Find the stock and update the quantity
        await BloodStock.findByIdAndUpdate(stockId, { quantity });

        // Redirect back to the manage stock page
        res.redirect('/volunteer/manage-stock');
    } catch (error) {
        console.error('Error updating blood stock:', error);
        res.status(500).send('Error updating blood stock');
    }
});







// Route for displaying the add awareness form
app.get('/volunteer/add-awareness', (req, res) => {
    res.render('volunteer/addAwareness'); // Create this view
});

// Route for handling the form submission
app.post('/volunteer/add-awareness', async (req, res) => {
    const { message, videoUrl } = req.body;

    const newAwareness = new Awareness({ message, videoUrl });
    await newAwareness.save();

    // console.log('Saved Awareness:', newAwareness); 
    res.redirect('/volunteer/dashboard'); // Redirect after submission
});

// Route to show all hospital blood requests
app.get('/volunteer/show-hospitals-request', async (req, res) => {
    try {
        // Fetch all blood requests from the database
        const requests = await BloodRequest.find()
            .populate('hospitalId', 'name location'); // Populate hospital details
        
        res.render('volunteer/showHospitalsRequest', { requests });
    } catch (error) {
        console.error('Error fetching hospital requests:', error);
        res.status(500).send('Error fetching requests');
    }
});
// Assuming you're accepting the request
app.post('/volunteer/accept-request/:requestId', async (req, res) => {
    const { requestId } = req.params;

    try {
        await BloodRequest.findByIdAndUpdate(requestId, { status: 'Accepted' });
        res.redirect('/volunteer/show-hospitals-request'); // Redirect after accepting
    } catch (error) {
        console.error('Error accepting request:', error);
        res.status(500).send('Error accepting request');
    }
});
// Assuming you're rejecting the request
app.post('/volunteer/reject-request/:requestId', async (req, res) => {
    const { requestId } = req.params;

    try {
        await BloodRequest.findByIdAndUpdate(requestId, { status: 'Rejected' });
        res.redirect('/volunteer/show-hospitals-request'); // Redirect after rejecting
    } catch (error) {
        console.error('Error rejecting request:', error);
        res.status(500).send('Error rejecting request');
    }
});
// Route to handle removing a blood request
app.post('/volunteer/remove-request/:id', async (req, res) => {
    try {
        const requestId = req.params.id;

        // Remove the request from the database
        await BloodRequest.findByIdAndDelete(requestId);

        // Redirect to the page showing hospital requests with a success message
        res.redirect('/volunteer/show-hospitals-request'); // Change this to the relevant page
    } catch (error) {
        console.error("Error removing blood request:", error);
        // Redirect to the same page with an error message
        res.redirect('/volunteer/show-hospitals-request?error=Could not remove the request.');
    }
});



// Route for displaying the add awareness form
app.get('/volunteer/add-awareness', (req, res) => {
    res.render('volunteer/addAwareness'); // Create this view
});

// Route for handling the form submission
app.post('/volunteer/add-awareness', async (req, res) => {
    const { message, image } = req.body; // image will now come from a text input

    const newAwareness = new Awareness({ message, image });
    await newAwareness.save();
    res.redirect('/volunteer/dashboard'); // Redirect after submission
});
















// Admin login route
app.get('/admin/login', (req, res) => {
    res.render('admin/login');
});

app.post('/admin/login', async (req, res) => {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email, password });
    if (admin) {
        req.session.adminId = admin._id; // Store admin ID in session
        res.redirect('/admin/dashboard');
    } else {
        res.redirect('/admin/login');
    }
});
// Admin dashboard route
app.get('/admin/dashboard', isAdmin, async (req, res) => {
    const admin = await Admin.findById(req.session.adminId);
    const users = await User.find();
    const volunteers = await Volunteer.find();
    res.render('admin/dashboard', { admin, users, volunteers });
});

// Route to display the "Add Volunteer" page
app.get('/admin/add-volunteer', isAdmin, (req, res) => {
    res.render('admin/addVolunteer');
});

// Route to handle adding a new volunteer
app.post('/admin/add-volunteer', isAdmin, async (req, res) => {
    const { username, email, password } = req.body;
    const newVolunteer = new Volunteer({ username, email, password });
    await newVolunteer.save();
    res.redirect('/admin/dashboard');
});
// Route to manage volunteers
app.get('/admin/manage-volunteers', async (req, res) => {
    try {
        const volunteers = await Volunteer.find(); // Fetch volunteers from the database
        res.render('admin/manageVolunteers', { volunteers }); // Render the view with volunteers
    } catch (error) {
        console.error('Error fetching volunteers:', error);
        res.status(500).send('Error fetching volunteers');
    }
});

// Route to remove a volunteer
app.post('/admin/remove-volunteer/:id', isAdmin, async (req, res) => {
    const { id } = req.params;
    await Volunteer.findByIdAndDelete(id);
    res.redirect('/admin/dashboard');
});
// Admin logout route
app.post('/admin/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/admin/login');
    });
});
// show stock to admin
app.get('/admin/show-stock', async (req, res) => {
    const bloodStock = await BloodStock.find();
    res.render('admin/bloodStock', { bloodStock });
});

// Route to render the add hospital form
app.get('/admin/add-hospital', (req, res) => {
    res.render('admin/addHospital'); // Render the add hospital form
});

// Route to handle adding a new hospital
app.post('/admin/add-hospital', async (req, res) => {
    const { name, location, email, password } = req.body;

    try {
        // Create a new hospital instance
        const newHospital = new Hospital({ name, location, email, password });

        // Save the hospital to the database
        await newHospital.save();

        // Redirect to the admin dashboard or show a success message
        res.redirect('/admin/dashboard'); // Adjust the redirect as needed
    } catch (error) {
        console.error('Error adding hospital:', error);
        res.status(500).send('Error adding hospital');
    }
});







//hospital routes

// Hospital login route
app.get('/hospital/login', (req, res) => {
    res.render('hospital/login');
});

app.post('/hospital/login', async (req, res) => {
    const { email, password } = req.body;
    const hospital = await Hospital.findOne({ email, password });
    if (hospital) {
        req.session.hospitalId = hospital._id; // Store hospital ID in session
        res.redirect('/hospital/dashboard');
    } else {
        res.redirect('/hospital/login');
    }
});
// Hospital dashboard route
app.get('/hospital/dashboard', isHospital, async (req, res) => {
    const hospital = await Hospital.findById(req.session.hospitalId);
    if (hospital) {
        res.render('hospital/dashboard', { hospital });
    } else {
        res.redirect('/hospital/login');
    }
});
// Logout route for hospitals
app.get('/hospital/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/hospital/login');
    });
});
// Route to display blood request form
app.get('/hospital/request-blood', (req, res) => {
    res.render('hospital/requestBlood'); // Create this view
});

// Route to handle blood request submission
app.post('/hospital/request-blood', async (req, res) => {
    const { bloodType, quantity, requestDate, isEmergency } = req.body;
    const hospitalId = req.session.hospitalId; // Assuming you store the hospital ID in session

    try {
        const bloodRequest = new BloodRequest({
            hospitalId,
            bloodType,
            quantity,
            requestDate,
            isEmergency: isEmergency ? true : false // Capture the emergency status
        });
        await bloodRequest.save();
        res.redirect('/hospital/dashboard'); // Redirect to the hospital dashboard
    } catch (error) {
        console.error('Error requesting blood:', error);
        res.status(500).send('Error requesting blood');
    }
});
// route to see hospital request status
app.get('/hospital/request-status', async (req, res) => {
    const hospitalId = req.session.hospitalId; // Assuming you store hospital ID in session

    try {
        // Fetch the blood requests made by the hospital
        const requests = await BloodRequest.find({ hospitalId }).populate('bloodType'); // Adjust according to your schema

        res.render('hospital/requestStatus', { requests }); // Render the request status view
    } catch (error) {
        console.error('Error fetching request status:', error);
        res.status(500).send('Error fetching request status');
    }
});


//footer routes for user
app.get('/about', (req, res) => {
    res.render('user/about'); 
});

app.get('/privacy', (req, res) => {
    res.render('user/privacy'); 
});

app.get('/terms', (req, res) => {
    res.render('user/terms'); 
});


// Start server
app.listen(8080, () => {
    console.log('Server is listening on port 8080');
});
