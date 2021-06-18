const nodemailer = require('nodemailer');

var transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: "email",
        pass: "password",
    }
})

module.exports.sendResetEmail = async(email, token) => {
    var url = "http://localhost:8080/user/reset-password?token=" + token;
    console.log(url)
}

module.exports.sendVerifyEmail = async(email, token) => {
    var url = "http://localhost:8080/user/verifyEmail?token=" + token;
    console.log(url)
    // await transport.sendMail({
    //     from: "email",
    //     to: email,
    //     subject: "VERIFY YOUR ACCOUNT",
    //     text: `Click this link to verify: ${url}`,
    //     html: `<h3>
    //     Click this link to verify: ${url}
    //     </h3>`
    // }) 
}