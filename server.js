'use '

const express = require('express');
const morgan = require('morgan');


//Connection, Schema and Model (cheat sheet)
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const { DATABASE_URL, PORT } = require('./config');
const { VideoPost } = require('./models');

const app = express();

app.use(morgan('common'));
app.use(express.json());

//GET /posts
app.get('/posts', (req, res) => {
    VideoPost
        .find()
        .then(posts => {
        res.json(posts.map(post => post.serialize()));
        })
        .catch(err =>{
        console.log(err);
        res.status(500).json({error: 'something aint right'});
    })
});


//GET /posts/:id
app.get('/posts/:id', (req, res) => {
  VideoPost
    .findById(req.params.id)
    .then(post => res.json(post.serialize()))
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'something went horribly awry' });
    });
});

//POST /posts
app.post('/posts', (req, res) => {
  const requiredFields = ['title', 'content', 'author'];
  for (let i = 0; i < requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
  }
    VideoPost
    .create({
      title: req.body.title,
      content: req.body.content,
      author: req.body.author
    })
    .then(videoPost => res.status(201).json(videoPost.serialize()))
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Something went wrong' });
    });

});

//DELETE /posts/:id
app.delete('/posts/:id', (req, res) => {
  VideoPost
    .findByIdAndRemove(req.params.id)
    .then(() => {
      res.status(204).json({ message: 'success' });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'something went terribly wrong' });
    });
});
    
//PUT /posts/:id
app.put('/posts/:id', (req, res) => {
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    res.status(400).json({
      error: 'Request path id and request body id values must match'
    });
  }

  const updated = {};
  const updateableFields = ['title', 'content', 'author'];
  updateableFields.forEach(field => {
    if (field in req.body) {
      updated[field] = req.body[field];
    }
  });

  VideoPost
    .findByIdAndUpdate(req.params.id, { $set: updated }, { new: true })
    .then(updatedPost => res.status(204).end())
    .catch(err => res.status(500).json({ message: 'Something went wrong' }));
});


app.delete('/:id', (req, res) => {
  VideoPost
    .findByIdAndRemove(req.params.id)
    .then(() => {
      console.log(`Deleted blog post with id \`${req.params.id}\``);
      res.status(204).end();
    });
});


app.use('*', function (req, res) {
  res.status(404).json({ message: 'Not Found' });
});


let server;

//this function conenct to database

function runServer(databaseUrl, port = PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
        .on('error', err => {
          mongoose.disconnect();
          reject(err);
        });
    });
  });
}

//this function closes the server
function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

if (require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { runServer, app, closeServer };







