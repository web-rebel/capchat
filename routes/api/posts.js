const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../../middleware/auth');

const { check, validationResult } = require('express-validator');

const Post = require('../../models/Post');
const User = require('../../models/User');
const Profile = require('../../models/Profile');

/**
 * @route   POST api/posts
 * @desc    Create a post
 * @access  Private
 */
router.post('/', [ auth, [
    check('text', 'Text is required').not().isEmpty()
]], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        const user = await User.findById(req.user.id).select('-password');

        const newPost = new Post({
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        })

        const post = await newPost.save();

        res.json(post);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET api/posts
 * @desc    Get all posts
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 });
        res.json(posts);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error')
    }
});

/**
 * @route   GET api/posts/:id
 * @desc    Get post by id
 * @access  Private
 */
router.get('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post){
            return res.status(404).json({ msg: 'Post Not Found' });
        }

        res.json(post);
    } catch (error) {
        console.error(error.message);
        if (error.kind === 'ObjectId'){
            return res.status(404).json({ msg: 'Post Not Found' });
        }
        res.status(500).send('Server Error')
    }
});

/**
 * @route   DELETE api/posts/:id
 * @desc    Delete a posts by id
 * @access  Private
 */
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post){
            return res.status(404).json({ msg: 'Post Not Found' });
        }

        // Check if user
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not Authorized' });
        }

        await post.remove();

        res.json({ msg: 'Post Removed' });

    } catch (error) {
        console.error(error.message);
        if (error.kind === 'ObjectId'){
            return res.status(404).json({ msg: 'Post Not Found' });
        }
        res.status(500).send('Server Error')
    }
});

/**
 * @route   PUT api/posts/like/:post_id
 * @desc    Like/Unlike a post
 * @access  Private
 */
router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post){
            return res.status(404).json({ msg: 'No post found' });
        }

        const like = post.likes.find(like => like.user.toString() === req.user.id);
        if (like){
            await like.remove();
            await post.save();
            return res.status(200).json(post.likes);
        }

        post.likes.unshift({ user: req.user.id });

        await post.save();
        return res.status(200).json(post.likes);

    } catch (error) {
        console.error(error.message);
        return res.status(500).send('Server Error')
    }
});

/**
 * @route   POST api/posts/comment/:id
 * @desc    Comment on a post
 * @access  Private
 */
router.post('/comment/:id', [ auth, [
    check('text', 'Text is required').not().isEmpty()
]], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        const user = await User.findById(req.user.id).select('-password');
        const post = await Post.findById(req.params.id);

        const newComment = {
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        }

        post.comments.unshift(newComment);

        await post.save();

        res.json(post.comments);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   DELETE api/posts/comment/:id/comment_id
 * @desc    Comment comment
 * @access  Private
 */
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post){
            return res.status(404).json({ msg: 'Post does not exist' });
        }

        // Pull out comment
        const comment = post.comments.find(comment => comment.id === req.params.comment_id);
        if (!comment){
            return res.status(404).json({ msg: 'Comment does not exist' });
        }

        // Must be comment creator
        if (req.user.id !== comment.user.toString()) {
            return res.status(401).json({ msg: 'User not Authorized' });
        }

        // remove from index
        const commentIndex = post.comments.map(comment => comment.id.toString()).indexOf(req.params.comment_id);

        post.comments.splice(commentIndex, 1);

        await post.save();
        res.status(200).json(post);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;