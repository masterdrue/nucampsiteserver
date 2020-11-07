const express = require('express');
const bodyParser = require('body-parser');
const Favorite = require('../models/favorite');
const authenticate = require('../authenticate');
const cors = require('./cors');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        Favorite.find({ user: req.user._id })
        .populate('campsites')
        .populate('user')
        .then(favorites => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(favorites);
        })
        .catch(err => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        //check for users favs list
        Favorite.findOne({ user: req.user._id })
            .then((favorite) => {
                //perform compare to search for specific fav
                if (favorite) {
                    req.body.forEach((fav) => {
                        //if fav not present then add the new fav
                        if (!favorite.campsites.includes(fav._id)) {
                            favorite.campsites.push(fav._id);
                        }
                    });
                    favorite.save()
                        .then((favorite) => {
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.json(favorite);
                        })
                        .catch((err) => next(err));
                } else {
                    //create the new object and respond to client 
                    Favorite.create({ user: req.user._id, campsites: req.body })    
                    .then((favorites) => {
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.json(favorites);
                        })
                        .catch((err) => next(err));
                }
            })
            .catch((err) => next(err));
    })
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites bro!');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    //remove the array
    Favorite.remove()
        .then(response => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(response);
        })
        .catch(err => next(err));
});

//CampsiteID
favoriteRouter.route('/:campsiteId')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end(`GET operation not supported on /favorites ID ${req.params.campsiteId} man!`);
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        //check for users favs list
        Favorite.findOne({ user: req.user._id })
            //perform compare to search for specific fav
            .then((favorite) => {
                if (favorite) {
                    // Fav not present then push the new fav in
                    if (!favorite.campsites.includes(req.params.campsiteId)) {
                        favorite.campsites.push(req.params.campsiteId);
                        
                        favorite.save()
                            .then((favorite) => {
                                res.statusCode = 200;
                                res.setHeader("Content-Type", "application/json");
                                res.json(favorite);
                            })
                            .catch((err) => next(err));

                    } else {
                        res.statusCode = 200;
                        res.end(`Campsite ${req.params.campsiteId} is already in your list of favorites!`)
                    }
                } else {
                     //create the new object and respond to client 
                    Favorite.create({ user: req.user._id, campsites: [req.params.campsiteId] })
                        .then((favorites) => {
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.json(favorites);
                        })
                        .catch((err) => next(err));
                }
            })
            .catch((err) => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (res, req, next) => {
        res.statusCode = 403;
        res.end('PUT operations dont work on /favorites');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({ user: req.user._id })
            .then((favorite) => {
                if (favorite) {
                    const index = favorite.campsites.indexOf(req.params.campsiteId);
                    
                    if (index >= 0) {
                        favorite.campsites.splice(index, 1);
                    
                        favorite.save()
                            .then((favorite) => {
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.json(favorite);
                            })
                            .catch((err) => next(err));

                    } else {
                        // No Fav to delete any more
                        res.statusCode = 200;
                        res.end(`Campsite ID ${req.params.campsiteId} is no longer in your favorites list!`)
                    }
                }
            })
            .catch((err) => next(err));
    });

module.exports = favoriteRouter;