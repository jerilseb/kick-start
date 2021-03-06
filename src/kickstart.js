#!/usr/bin/env node

"use strict";

const os = require("os");
const fs = require("fs-extra");
const program = require("commander");
const inquirer = require("inquirer");
const path = require("path");
const chalk = require("chalk");
const ora = require("ora");
const git = require("simple-git/promise");

const log = console.log;

let repoList = null;
let kickstartDir = null;
let kickstartFile = null;
createStore();

program
  .version("1.0.0")
  .option("-a, --add", "Add a repository")
  .option("-r, --remove", "Remove a repository")
  .parse(process.argv);

if (program.add) addRepo();
else if (program.remove) removeRepo();
else {
  if (repoList === null || repoList.repos.length === 0) {
    log(
      chalk.cyan(
        "No starter kits available. Use the -a option to add a new one"
      )
    );
  } else {
    cloneRepo();
  }
}

// Create a JSON file to store the list of
// repositories in the user's home directory

function createStore() {
  kickstartDir = path.join(os.homedir(), ".kickstart");
  kickstartFile = path.join(kickstartDir, "repoList.json");
  fs.ensureFileSync(kickstartFile);

  repoList = fs.readJsonSync(kickstartFile, { throws: false });
  if (repoList === null) {
    repoList = {
      repos: []
    };
    fs.writeFileSync(kickstartFile, JSON.stringify(repoList));
  }
}

// Read from the console and
// add a repository to the JSON file

async function addRepo() {
  let answers = await inquirer.prompt([
    {
      type: "input",
      name: "repo_name",
      message: "Name of the starter kit?"
    },
    {
      type: "input",
      name: "repo_url",
      message: "Git url of the starter kit?"
    }
  ]);

  if (getRepoName(answers.repo_name) !== undefined) {
    log(chalk.red("Name '" + answers.repo_name + "' already exists"));
  } else {
    repoList.repos.push({
      name: answers.repo_name,
      url: answers.repo_url.replace(".git", "")
    });
    fs.writeFileSync(kickstartFile, JSON.stringify(repoList));
  }
}

// Read from the console and
// remove a repository from the JSON file

async function removeRepo() {
  var repo_choices_to_remove = [];
  repoList.repos.forEach(function(item) {
    repo_choices_to_remove.push({
      name: item.name
    });
  });

  let answers = await inquirer.prompt([
    {
      type: "checkbox",
      name: "repos_to_remove",
      message: "Select the starter kits to remove",
      choices: repo_choices_to_remove
    }
  ]);

  removeRepoByName(answers.repos_to_remove);
  fs.writeFileSync(kickstartFile, JSON.stringify(repoList));
  log(chalk.green("√ Successfully removed the selected repositories"));
}

// Select the repository from the console and clone it

async function cloneRepo() {
  var repo_choices = [];
  repoList.repos.forEach(function(item) {
    repo_choices.push(item.name);
  });

  let answer1 = await inquirer.prompt([
    {
      type: "list",
      name: "repo_to_clone",
      message: "Choose a starter kit to clone",
      choices: repo_choices
    }
  ]);

  const gitUrl = getRepoName(answer1.repo_to_clone).url;
  const repoName = gitUrl.substr(gitUrl.lastIndexOf("/") + 1);

  let answer2 = await inquirer.prompt([
    {
      type: "input",
      name: "project_name",
      message: `Name of your project? (${repoName}) :`
    }
  ]);

  let projectName = answer2.project_name || repoName;
  const spinner = new ora({ text: "Cloning " + repoName }).start();

  git(os.tmpdir())
    .silent(true)
    .clone(gitUrl)
    .then(() => {
      spinner.stop();
      fs.moveSync(path.join(os.tmpdir(), repoName), projectName);
      log(chalk.green("√ Successfully cloned to", projectName));
    })
    .catch(err => {
      spinner.stop();
      log(
        chalk.red(
          `Couldn't clone the repository. Make sure a directory by the name ${repoName} doesn't already exist`
        )
      );
    });
}

// Check if the repository is already added to the JSON file.
// If yes, return the entry, else return 'undefined'

function getRepoName(repoName) {
  return repoList.repos.find(_repo => _repo.name == repoName);
}

// Remove a repository from the JSON file

function removeRepoByName(repoName) {
  let index = repoList.repos.findIndex(_repo => _repo.name == repoName);
  repoList.repos.splice(index, 1);
}
