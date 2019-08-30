const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');
const Profile = require('../../models/Profile');

/**
 * @route   Get api/profile/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);

        if(!profile){
            return res.status(400).json({ msg: 'There is no profile for this user' });
        }

        res.json(profile);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   Post api/profile
 * @desc    Create or update user profile
 * @access  Private
 */
router.post('/', [auth, [
    check('status', 'Status is required').not().isEmpty(),
    check('skills', 'Skills is required').not().isEmpty()
]], async (req, res) => {

    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    const {company, website, location, bio, status, githubusername, skills, youtube, facebook, twitter, instagram, linkedin} = req.body;

    // Build profile object
    const profileFields = {};
    profileFields.user                                  = req.user.id;
    if (company)        profileFields.company           = company;
    if (website)        profileFields.website           = website;
    if (location)       profileFields.location          = location; 
    if (bio)            profileFields.bio               = bio;
    if (status)         profileFields.status            = status;
    if (githubusername) profileFields.githubusername    = githubusername
    if (skills)         profileFields.skills            = skills.split(',').map(skill => skill.trim());

    // Build social array
    profileFields.social = {};
    if (youtube)        profileFields.social.youtube    = youtube;
    if (facebook)       profileFields.social.facebook   = facebook;
    if (twitter)        profileFields.social.twitter    = twitter;
    if (instagram)      profileFields.social.instagram  = instagram;
    if (linkedin)       profileFields.social.linkedin   = linkedin;

    try {
        let profile = await Profile.findOne({ user: req.user.id });

        // Update
        if (profile) {

            profile = await Profile.findOneAndUpdate(
                { user: req.user.id }, 
                { $set: profileFields },
                { new: true}
            );

            return res.json(profile);
        } 

        // Create
        profile = new Profile(profileFields);
        await profile.save();

        // Return profile
        res.json(profile);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   Get api/profile/user/:user_id
 * @desc    Get user profile by id
 * @access  Public
 */
router.get('/user/:user_id', async (reg, res) => {

    try {
        const profile = await Profile.findOne({ user: reg.params.user_id }).populate('user', ['name', 'avatar']);

        if (!profile) { 
            return res.status(400).json({ msg: 'Profile not found'});
        }

        res.json(profile);
    } catch (error) {

        if (error.kind == 'ObjectId'){
            return res.status(400).json({ msg: 'Profile not found'});
        }
        
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   Get api/profile
 * @desc    Get all user profiles
 * @access  Public
 */
router.get('/', async (reg, res) => {

    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;