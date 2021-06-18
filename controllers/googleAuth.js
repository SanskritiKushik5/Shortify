var GoogleStrategy = require('passport-google-oauth20').Strategy;
const user = require("../models/user");
const clientId = require("../config/googleData").clientId;
const clientSecret = require("../config/googleData").clientSecret;

module.exports = function(passport) {
    passport.use(new GoogleStrategy({
        clientID: clientId,
        clientSecret: clientSecret,
        callbackURL: "http://127.0.0.1:8080/google/callback"
    }, (accessToken, refreshToken, profile, done) => {
        user.findOne({email: profile.emails[0].value}).then((data) => {
            if(data){
                return done(null, data);
            }else{
                user({
                    email: profile.emails[0].value,
                    googleId: profile.id,
                    password: null,
                    provider: "google",
                    isVerified: true,
                }).save((err, data) => {
                    return done(null, data);
                })
            }
        })
    }
    ));
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });
    passport.deserializeUser((id, done) => {
        user.findById(id, (err, user) => {
            done(err, user);
        })
    })
}