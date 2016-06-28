var express = require('express');
var mongoose = require('mongoose');
var db = mongoose.createConnection('localhost', 'pollsapp');
var PollSchema = require('../models/Poll.js').PollSchema;
var Poll = db.model('polls', PollSchema);
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Polls' });
});

// JSON API for list of polls
router.get('/polls/polls',  function(req, res) {
  Poll.find({}, 'question', function(error, polls) {
    res.json(polls);
  });
});


// JSON API for getting a single poll
router.get('/polls/:id', function(req, res) {
  var pollId = req.params.id;
  Poll.findById(pollId, '', { lean: true }, function(err, poll) {
    if(poll) {
      var userVoted = false,
          userChoice,
          totalVotes = 0;
      for(var c in poll.choices) {
        var choice = poll.choices[c];
        for(var v in choice.votes) {
          var vote = choice.votes[v];
          totalVotes++;
          if(vote.ip === (req.header('x-forwarded-for') || req.ip)) {
            userVoted = true;
            userChoice = { _id: choice._id, text: choice.text };
          }
        }
      }
      poll.userVoted = userVoted;
      poll.userChoice = userChoice;
      poll.totalVotes = totalVotes;
      res.json(poll);
    } else {
      res.json({error:true});
    }
  });
});

// JSON API for creating a new poll
router.post('/polls', function(req, res) {
  var reqBody = req.body,
      choices = reqBody.choices.filter(function(v) { return v.text !== ''; }),
      pollObj = {question: reqBody.question, choices: choices};
  var poll = new Poll(pollObj);
  poll.save(function(err, doc) {
    if(err || !doc) {
      throw 'Error';
    } else {
      res.json(doc);
    }
  });
});

module.exports = router;
