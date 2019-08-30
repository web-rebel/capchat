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
router.get('/user/:user_id', async (req, res) => {

    try {
        const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);

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
router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   DELETE api/profile
 * @desc    Delete profile, user and posts
 * @access  Private
 */
router.delete('/', auth, async (req, res) => {
    try {
        // Remove profile
        await Profile.findOneAndRemove({ user: req.user.id });

        // Remove the user
        await User.findOneAndRemove({ _id: req.user.id });

        res.json({ msg: 'User deleted' });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   PUT api/profile/experience
 * @desc    Add profile experience
 * @access  Private
 */
router.put('/experience', [ auth, [
    check('title', 'Title is required').not().isEmpty(),
    check('company', 'Company is required').not().isEmpty(),
    check('from', 'From date is required').not().isEmpty(),

]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    const { title, company, location, from, to, current, description } = req.body;

    const newExperience = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    }

    try {
        const profile = await Profile.findOne({ user: req.user.id });

        if (!profile) { 
            return res.status(400).json({ msg: 'No profile was found'});
        }

        profile.experience.unshift(newExperience);

        await profile.save();

        res.json(profile);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   PUT api/profile/experience/:exp_id
 * @desc    Update profile experience
 * @access  Private
 */
router.put('/experience/:exp_id', auth, async (req, res) => {
    
    const { title, company, location, from, to, current, description } = req.body;

    const newExperience = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    }
    
    try {

        const profile = await Profile.findOneAndUpdate({ user: req.user.id });

        if (!profile){
            return res.status(400).json({ msg: 'No profile was found' });
        } 

        const updateIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);

        profile.experience.splice(updateIndex, 1, newExperience);

        await profile.save();

        res.json(profile);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   DELETE api/profile/experience/:exp_id
 * @desc    Delete profile experience
 * @access  Private
 */
router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {

        const profile = await Profile.findOne({ user: req.user.id });

        if (!profile){
            return res.status(400).json({ msg: 'No profile was found' });
        } 

        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);

        profile.experience.splice(removeIndex, 1);

        await profile.save();

        res.json(profile);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   PUT api/profile/education
 * @desc    Add profile education
 * @access  Private
 */
router.put('/education', [ auth, [
    check('school', 'School is required' ).not().isEmpty(),
    check('degree', 'Degree is required' ).not().isEmpty(),
    check('fieldofstudy', 'Field of study is required' ).not().isEmpty(),
    check('from', 'From is required' ).not().isEmpty(),
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { school, degree, fieldofstudy, from, to, current, description } = req.body;

    const newEduction = {
        school,
        degree,
        fieldofstudy,
        from,
        to, 
        current,
        description
    };

    try {
        const profile = await Profile.findOne({ user: req.user.id });

        if (!profile){
            return res.status(400).json({ msg: 'No profile was found'});
        }

        profile.education.unshift(newEduction);
        profile.save();
        res.json(profile);
        
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   PUT api/profile/education/:edu_id
 * @desc    Update profile education
 * @access  Private
 */
router.put('/education/:edu_id', auth, async (req, res) => {
    
    const { school, degree, fieldofstudy, from, to, current, description } = req.body;

    const newEduction = {
        school,
        degree,
        fieldofstudy,
        from,
        to, 
        current,
        description
    };
    
    try {

        const profile = await Profile.findOneAndUpdate({ user: req.user.id });

        if (!profile){
            return res.status(400).json({ msg: 'No profile was found' });
        } 

        const updateIndex = profile.education.map(item => item.id).indexOf(req.params.exp_id);

        profile.education.splice(updateIndex, 1, newEduction);

        await profile.save();

        res.json(profile);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   DELETE api/profile/education/:exp_id
 * @desc    Delete profile education
 * @access  Private
 */
router.delete('/education/:exp_id', auth, async (req, res) => {
    try {

        const profile = await Profile.findOne({ user: req.user.id });

        if (!profile){
            return res.status(400).json({ msg: 'No profile was found' });
        } 

        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.exp_id);

        profile.education.splice(removeIndex, 1);

        await profile.save();

        res.json(profile);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});
module.exports = router;