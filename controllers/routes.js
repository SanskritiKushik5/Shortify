const express = require('express');
const router = express.Router();
const user = require('../models/user');
const urls = require('../models/url');
const bcryptjs = require('bcryptjs');
const passport = require('passport');
require('./passportLocal')(passport);
require('./googleAuth')(passport);

function checkAuth(req, res, next){
    if(req.isAuthenticated()){
        res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, post-check=0, pre-check=0');
        next();
    }else{
        req.flash('error_message', "Please login to continue!");
        res.redirect('/login');
    }
}

router.get('/login', (req, res) => {
    res.render("login");
});

router.get('/signup', (req, res) => {
    res.render("signup");
});

router.post('/signup', (req, res) => {
    const { email, password, confirmpassword } = req.body;
    if (!email || !password || !confirmpassword ){
        res.render("signup", { err: "All Fields Required!", csrfToken: req.csrfToken() });
    }else if(password != confirmpassword){
        res.render("signup", { err: "Passwords don't match!", csrfToken: req.csrfToken() });
    }else{
        user.findOne({ $or: [{ email: email }]}, (err, data) => {
            if(err) throw err;
            if(data){
                res.render("signup", { err: "User Exists, Try logging in!", csrfToken: req.csrfToken()})
            }else{
                bcryptjs.genSalt(12, (err, salt) => {
                    if (err) throw err;
                    bcryptjs.hash(password, salt, (err, hash) => {
                        if (err) throw err;
                        user({
                            email: email,
                            password: hash,
                            googleId: null,
                            provider: 'email',
                        }).save((err, data) => {
                            if(err) throw err;
                            res.redirect("/login");
                        })
                    })
                })
            }
        })
    }
});
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        failureRedirect: '/login',
        successRedirect: '/dashboard',
        failureFlash: true,
    })(req, res, next);
});
router.get('/logout', (req, res) => {
    req.logout();
    req.session.destroy((err) => {
        res.redirect('/')
    })
});
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email',] }));

router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    res.render('dashboard')
});
router.get('/dashboard', checkAuth, (req,res) => {
    urls.find({owned: req.user.email}, (err, data) => {
        if (err) throw err;
        res.render('dashboard', { verified: req.user.isVerified, urls: data});
    });
});
router.post('/create', checkAuth, checkAuth, (req, res) => {
    const { original, short } = req.body;
    if(!original || !short){
        res.render('dashboard', { verified: req.user.isVerified, err: "Empty Fields!"});
    }else{
        urls.findOne({slug: short}, (err, data) => {
            if(err) throw err;
            if(data){
                res.render('dashboard', { verified: req.user.isVerified, err: "Try Different Short Url, This exists!"});  
            }else{
                urls({
                    originalUrl: original,
                    slug: short,
                    owned: req.user.email,
                }).save((err) => {
                    res.redirect('/dashboard');
                });
            }
        });
    }
});

router.use(require('./userRoutes'));
router.get('/:slug?', async (req, res) => {
    if (req.params.slug != undefined) {
        var data = await urls.findOne({ slug: req.params.slug });
        if (data) {
            data.visits = data.visits + 1;
            var ref = req.query.ref;
            if (ref) {
                switch (ref) {
                    case 'fb':
                        data.visitsFB = data.visitsFB + 1;
                        break;
                    case 'ig':
                        data.visitsIG = data.visitsIG + 1;
                        break;
                    case 'yt':
                        data.visitsYT = data.visitsYT + 1;
                        break;
                }
            }
            await data.save();
            res.redirect(data.originalUrl);
        } else {
            if (req.isAuthenticated()) {
                res.render("index", { logged: true, err: true });
            } else {
                res.render("index", { logged: false, err: true });
            }
        }
    } else {
        if (req.isAuthenticated()) {
            res.render("index", { logged: true });
        } else {
            res.render("index", { logged: false });
        }
    }
});
module.exports = router;