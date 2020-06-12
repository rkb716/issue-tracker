/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var mongodb = require('mongodb');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = function (app) {
  mongoose.connect(process.env.DATABASE, {useNewUrlParser: true, useUnifiedTopology: true});
  const IssueSchema = new Schema({
    issue_title: String,
    issue_text: String,
    created_by: String,
    assigned_to: String,
    status_text: String,
    created_on: Date,
    updated_on: Date,
    open: Boolean
  });
  const ProjectSchema = new Schema({
    project_name: String,
    project_issues: [IssueSchema]
  });
  const PROJECT = mongoose.model("PROJECT", ProjectSchema);
  const ISSUE = mongoose.model("ISSUE", IssueSchema);

  app.route('/api/reset').get(function(req, res) {
    ISSUE.deleteMany({}, (err, doc) => {
      if(err) {
        console.log(err);
      }
    })
    PROJECT.deleteMany({}, (err, doc) => {
      if(err) {
        console.log(err);
      }
    })
  })

  app.route('/api/issues/:project')

  //I can POST /api/issues/{projectname} with form data containing required issue_title, issue_text, created_by, and optional assigned_to and status_text.
  //The object saved (and returned) will include all of those fields (blank for optional no input) and also include created_on(date/time), updated_on(date/time), open(boolean, true for open, false for closed), and _id.
  .post(function (req, res){
    var project = req.params.project;
    if(req.body.issue_title == undefined || req.body.issue_text == undefined || req.body.created_by == undefined){
      return res.json({error: "Could not POST issue"});
    }
    PROJECT.findOneAndUpdate({project_name: project}, {}, {upsert: true, new: true, setDefaultsOnInsert: true}, (err, projObj) => {
      if(err) {
        console.log(err);
        return res.json({error: "Could not POST issue"});
      } else {
        let assignedTo = "";
        let statusText = "";
        if(req.body.assigned_to != undefined) {
          assignedTo = req.body.assigned_to;
        }
        if(req.body.status_text != undefined) {
          statusText = req.body.status_text;
        }
        let newIssue = new ISSUE({issue_title: req.body.issue_title, issue_text: req.body.issue_text, created_by: req.body.created_by, assigned_to: assignedTo, status_text: statusText, created_on: new Date(), updated_on: new Date(), open: true});
        newIssue.save((err) => {
          if(err) {
            console.log(err);
          }
        });
        projObj.project_issues.push(newIssue);
        projObj.save((err) => {
          if(err) {
            console.log(err);
          }
        });
        return res.json(newIssue.toJSON());
      }
    });
  })

  //I can GET /api/issues/{projectname} for an array of all issues on that specific project with all the information for each issue as was returned when posted.
  //I can filter my get request by also passing along any field and value in the query(ie. /api/issues/{project}?open=false). I can pass along as many fields/values as I want.
  .get(function (req, res){
    var project = req.params.project;
    console.log("GET called for project: " + project);
    PROJECT.findOneAndUpdate({project_name: project}, {}, {upsert: true, new: true, setDefaultsOnInsert: true}, (err, projObj) => {
      if(err) {
        console.log(err);
        return res.json({error: "Could not GET project"});
      } else {
        console.log("Getting docs for project: " + project);
        let toReturn = projObj.project_issues.filter(function(issue) {
          if(req.body.issue_title != undefined) {
            if(req.body.issue_title != issue.issue_title) {
              return false;
            }
          }
          if(req.body.issue_text != undefined) {
            if(req.body.issue_text != issue.issue_text) {
              return false;
            }
          }
          if(req.body.created_by != undefined) {
            if(req.body.created_by != issue.created_by) {
              return false;
            }
          }
          if(req.body.assigned_to != undefined) {
            if(req.body.assigned_to != issue.assigned_to) {
              return false;
            }
          }
          if(req.body.status_text != undefined) {
            if(req.body.status_text != issue.status_text) {
              return false;
            }
          }
          if(req.body.open != undefined) {
            if(req.body.open != issue.open) {
              return false;
            }
          }
          return true;
        });
        return res.json(toReturn);
      }
    })
  })  
  
  //I can PUT /api/issues/{projectname} with a _id and any fields in the object with a value to object said object. Returned will be 'successfully updated' or 'could not update '+_id. This should always update updated_on. If no fields are sent return 'no updated field sent'.
  .put(function (req, res){
    var project = req.params.project;
    var _id = req.body._id;
    console.log("put called with _id: " + _id);
    if(_id == undefined) {
      return res.json({error: "Missing id"});
    }
    PROJECT.findOne({project_name: project}, (err, projObj) => {
      if(err) {
        console.log(err);
        return "could not update " + _id;
      } else {
        let issue = projObj.project_issues.id(_id);
        if(issue == null || issue == undefined) {
          return "could not update " + _id;
        }
        issue.updated_on = new Date();
        let updatedFieldSent = false;
        if(req.body.issue_title != undefined) {
          issue.issue_title = req.body.issue_title;
          updatedFieldSent = true;
        }
        if(req.body.issue_text != undefined) {
          issue.issue_text = req.body.issue_text;
          updatedFieldSent = true;
        }
        if(req.body.created_by != undefined) {
          issue.created_by = req.body.created_by;
          updatedFieldSent = true;
        }
        if(req.body.assigned_to != undefined) {
          issue.assigned_to = req.body.assigned_to;
          updatedFieldSent = true;
        }
        if(req.body.status_text != undefined) {
          issue.status_text = req.body.status_text;
          updatedFieldSent = true;
        }
        if(req.body.open != undefined) {
          issue.open = req.body.open;
          updatedFieldSent = true;
        }
        projObj.save((err) => {
          if(err) {
            console.log(err);
          }
        });
        console.log("finishing up PUT");
        if(!updatedFieldSent) {
          return res.send("no updated field sent");
        }
        return res.send("successfully updated");
      }
    })
  })
  
  //I can DELETE /api/issues/{projectname} with a _id to completely delete an issue. If no _id is sent return '_id error', success: 'deleted '+_id, failed: 'could not delete '+_id.
  .delete(function (req, res){
    console.log("DELETE called for project: " + req.params.project + " and id: " + req.body._id);
    var project = req.params.project;
    var _id = req.body._id;
    if(_id == null || _id == undefined) {
      return res.send("_id error");
    } else {
      PROJECT.findOne({project_name: project}, (err, projObj) => {
        if(err) {
          console.log(err);
          return "error: could not find project: " + project;
        } else {
          console.log("deleting issue for project: " + project + " with issue id: " + _id);
          projObj.project_issues.id(_id).remove();
          projObj.save((err) => {
            if(err) {
              console.log(err);
              return res.send("failed: could not delete " + _id);
            }
          });
          return res.send("success: deleted " + _id);
        }
      });
    }
  });

  //404 Not Found Middleware
  app.use(function(req, res, next) {
    res.status(404)
      .type('text')
      .send('Not Found');
  });

};
