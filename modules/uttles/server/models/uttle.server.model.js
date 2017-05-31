'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Uttle Schema
 */
var UttleSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  lastHit: {
    type: Date,
    default: Date.now
  },
  url: {
    type: String,
    default: '',
    trim: true,
    required: 'URL cannot be blank'
  },
  title: {
    type: String,
    default: '',
    trim: true
  },
  summary: {
    type: String,
    default: ''
  },
  imageUrl: {
    type: String,
    default: '',
    trim: true
  },
  imageHeight: {
    type: Number,
    default: 241
  },
  imageWidth: {
    type: Number,
    default: 241
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  }, 
  submissions: {
    type: Number,
    default: 0
  },
  submitters: [{
    type: Schema.ObjectId,
    ref: 'User'
  }],   
  tags: [{
    type: String,
    lowercase: true,
    trim: true  
  }],
  replyCount: {
    type: Number,
    default: 0
  },
  provider: {
    name: {
      type: String,
      default: '',
      trim: true
    },
    url: {
      type: String,
      default: '',
      trim: true
    }
  },
  contentType: {
    type: String,
    default: '',
    trim: true
  },
  contentHtml: {
    type: String
  },
  replies: [{
    type: Schema.ObjectId,
    ref: 'Reply'
  }]
}, { collection : 'theuttles' });


// Define a text index for searching
UttleSchema.index({
  tags : 'text',
  title: 'text',
  summary: 'text'
});

mongoose.model('Uttle', UttleSchema);
