const express = require('express');
const router = express.Router();
const { users, loanQuestionnaire, uploadDocument } = require('../models/model');

function randomString() {
    const randomStringOneLiner = Math.random().toString(36).substr(2, 10);
    console.log(randomStringOneLiner);
    return randomStringOneLiner
}
function randomDecision(probability) {
    // Ensure probability is between 0 and 100
    if (probability < 0 || probability > 100) {
        throw new Error("Probability must be a number between 0 and 100.");
    }
    
    // Generate a random number between 0 and 100
    const randomNum = Math.random() * 100;
    
    // Return "Accepted" if the random number is less than the probability, otherwise "Rejected"
    return randomNum < probability ? "Accepted" : "Rejected";
}

// endpoint for logging in
router.post('/checkUser', async (req, res) => {
    console.log("userdetails: ", req.body)
    let usernamelog = req.body.username
    let passwordlog = req.body.password
    // let typelog = req.body.type //type indicates whether it is student or counsellor logging in 

    // let log = login(usernamelog, passwordlog, typelog)
    // console.log("login is", log)
    // res.send(log) //frontend will check if it's a valid cookie
    // // res.send("done")
    console.log("user data is",await users.find()) //debugging
    selectedUser = await users.findOne({
        email:usernamelog,
        password:passwordlog
    })
    // add selectedUser.id later. It may cause server errors if null
    console.log("user selected", await selectedUser)

    if (selectedUser != null) {
        let cookie = randomString()
        // update the document with the cookie
        selectedUser.usercookie = cookie
        console.log("selected user", selectedUser)
        selectedUser.save()
        let userdetails = {
            valid: true,
            admin: selectedUser.admin,
            usercookie: cookie
        }
        res.status(200).send(userdetails)
    }
    else {
        let userdetails = {
            valid: false
        }
        res.status(200).send(userdetails)
    } 

})

// endpoint for registering a new user
router.post('/post', async (req, res) => {
    try {
        // Check if the email already exists
        const existingUser = await users.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        // Fetch the last document
        const lastRecord = await users.findOne().sort({ id: -1 });

        // Determine the new id
        const newId = lastRecord ? lastRecord.id + 1 : 1;

        // Create a new document
        const data = new users({
            id: newId,
            email: req.body.email,
            password: req.body.password,
            fullname: req.body.fullname,
            admin: false,
            usercookie: "None"
        });

        // Save the new document
        const dataToSave = await data.save();
        res.status(200).json(dataToSave);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get all applications made by a user
router.post('/getAllApplic', async (req, res) => {
    // res.send('Get All API')
    try{
        const data = await loanQuestionnaire.find({ username: req.body.username });
        res.json(data)
    }
    catch(error){
        res.status(500).json({message: error.message})
    }
})


// Get all applications, every single one
router.post('/adminGetAll', async (req, res) => {
    // res.send('Get All API')
    try{
        const data = await loanQuestionnaire.find();
        res.json(data)
    }
    catch(error){
        res.status(500).json({message: error.message})
    }
})

// Get only one application, using it's id
router.post('/adminGetOne', async (req, res) => {
    // res.send('Get All API')
    try{
        const data = await loanQuestionnaire.find({ id: req.body.id });
        res.json(data)
    }
    catch(error){
        res.status(500).json({message: error.message})
    }
})

// Get only one application, using it's id
router.post('/adminGetUpOne', async (req, res) => {
    // res.send('Get All API')
    try{
        const data = await uploadDocument.find({ id: req.body.id });
        res.json(data)
    }
    catch(error){
        res.status(500).json({message: error.message})
    }
})

// // Change one applications loanStatus, using it's id
// router.post('/adminChangeOne', async (req, res) => {
//     // res.send('Get All API')
//     try{
//         const data = await loanQuestionnaire.find({ id: req.body.id });
//         data.loanStatus = req.body.loanStatus;

//         // Save the new document
//         const dataToSave = await data.save();
//         // console.log("data saved", dataToSave)
//         res.status(200).json(dataToSave);
//         // res.json(data)
//     }
//     catch(error){
//         res.status(500).json({message: error.message})
//     }
// })

// Change one application's loanStatus using its id
router.post('/adminChangeOne', async (req, res) => {
    try {
        // Find the document by id
        const data = await loanQuestionnaire.findOne({ id: req.body.id }); // Use findOne instead of find

        // Check if the document exists
        if (!data) {
            return res.status(404).json({ message: 'Loan application not found' });
        }

        // Update the loanStatus
        data.loanStatus = req.body.loanStatus;

        // Save the updated document
        const updatedData = await data.save();

        // Send the updated document as a response
        res.status(200).json(updatedData);
    } catch (error) {
        // Handle errors
        res.status(500).json({ message: error.message });
    }
});


// endpoint for submitting a loan questionnaire
router.post('/businessShow', async (req, res) => {
    try {
        console.log("req.body", req.body)
        // Fetch the last document
        const lastRecord = await loanQuestionnaire.findOne().sort({ id: -1 });

        // Determine the new id
        const newId = lastRecord ? lastRecord.id + 1 : 1;

        // posting the details to the ai endpoint for prediction
        const aIdata = {
            how_long_has_your_business_been_active: req.body.businessInfo.businessAge,
            what_type_of_business_do_you_run: req.body.businessInfo.businessType,
            in_which_industry_does_your_business_operate: req.body.businessInfo.businessIndustry,
            lga_of_business: req.body.businessInfo.businessLGA,
            town_of_business: req.body.businessInfo.businessTown,
            do_you_have_a_bank_account_for_your_business: req.body.financeInfo.bankAccountQuestion,
            do_you_use_any_digital_payment_systems: req.body.financeInfo.digitalPaymentQuestion,
            how_do_you_manage_your_business_finances: req.body.financeInfo.businessFinanceQuestion,
            what_are_the_biggest_challenges_your_business_faces: req.body.challengeInfo.biggestChallengesQuestion,
            what_kind_of_support_would_you_like_from_government: req.body.challengeInfo.govtSupportQuestion,
            what_would_help_your_business_grow_the_most: req.body.challengeInfo.businessGrowthQuestion,
            have_you_ever_tried_to_get_a_loan_for_your_business: req.body.loanInfo.loanBeforeQuestion,
            if_yes_how_did_you_get_the_loan: req.body.loanInfo.loanHowQuestion,
            if_you_did_not_get_a_loan_what_was_the_main_reason: req.body.loanInfo.whyNoLoan,
            have_you_faced_any_issues_with_government_rules_or_taxes: req.body.regulatoryInfo.regulatoryChallengeQuestion,
        }
        // post aIdata to the ai endpoint
        const aIresponse = await fetch('https://4c95-102-90-44-36.ngrok-free.app/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(aIdata),
        });
        const aIresponseJson = await aIresponse.json();
        console.log("aIresponseJson", aIresponseJson);

        // if airesponseJson is "Eligible for Loan" change it to "Accepted", if it is "Not Eligible for Loan" change it to "Rejected"
        let loanStatus = aIresponseJson == "Eligible for Loan" ? "Accepted" : "Rejected";
        console.log("loanStatus", loanStatus);

        // Create a new document
        // console.log("req.body.personalInfo", req.body.personalInfo)
        const data = new loanQuestionnaire({
            id: newId,
            personalInfo: req.body.personalInfo,
            businessInfo: req.body.businessInfo,
            financeInfo: req.body.financeInfo,
            challengeInfo: req.body.challengeInfo,
            loanInfo: req.body.loanInfo,
            regulatoryInfo: req.body.regulatoryInfo,
            username: req.body.username,
            usercookie: req.body.usercookie,
            loanStatus: loanStatus
        });

        // Save the new document
        const dataToSave = await data.save();
        // console.log("data saved", dataToSave)
        res.status(200).json(dataToSave);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


// endpoint for uploading documents and loan details
router.post('/uploadDocument', async (req, res) => {
    try {
        // Fetch the last document
        const lastRecord = await uploadDocument.findOne().sort({ id: -1 });

        // Determine the new id id: newId,
        const newId = lastRecord ? lastRecord.id + 1 : 1;

        // Create a new document
        const data = new uploadDocument({
            id: newId,
            username: req.body.username,
            applicationID: req.body.applicationID,
            idCardLink: req.body.idCardLink,
            businessCertificateLink: req.body.businessCertificateLink,
            bankStatementLink: req.body.bankStatementLink,
            BVN: req.body.BVN,
            LoanAmount: req.body.LoanAmount,
            LoanDuration: req.body.LoanDuration,
            interestRate: req.body.interestRate,
            PaymentPer: req.body.PaymentPer
        });

        console.log("Upload document data is: ",data)
        // Save the new document
        const dataToSave = await data.save();
        res.status(200).json(dataToSave);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});





module.exports = router;