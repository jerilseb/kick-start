'use strict';

const os = require('os');
const fs = require('fs-extra');
const program = require('commander');
const inquirer = require('inquirer');
const gitclone = require('gitclone');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const logSymbols = require('log-symbols');

const log = console.log;

let repoList = null;
createStore();

program
    .version('1.0.0')
    .option('-a, --add', 'Add a repository')
    .option('-r, --remove', 'Remove a repository')
    .parse(process.argv);


if (program.add) addRepo();
else if (program.remove) removeRepo();
else {
    if (repoList === null || repoList.repos.length === 0) {
    	log(chalk.cyan("No starter kits available. Use the -a option to add a new one"));
    } else {
    	cloneRepo();
    }
}


// Create a JSON file to store the list of 
// repositories in the user's home directory

function createStore() {
    const kickstartDir = path.join(os.homedir(), '.kickstart');
    const kickstartFile = path.join(kickstartDir, 'repoList.json');   
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
    let answers = await inquirer.prompt([{
        type: 'input',
        name: 'repo_name',
        message: 'Name of the starter kit?'
    }, {
        type: 'input',
        name: 'repo_url',
        message: 'Git url of the starter kit?'
    }]);

    if (getRepoName(answers.repo_name) !== undefined) {
        log(chalk.red('Name already exists. Try a differnt name?'));
    } else {
        repoList.repos.push({
            name: answers.repo_name,
            url: answers.repo_url
        });
        fs.writeFileSync(kickstartFile, JSON.stringify(repoList));
    }
}


// Read from the console and 
// remove a repository from the JSON file

async function removeRepo() {
    var repo_choices_to_remove = [];
    repoList.repos.forEach(function (item) {
        repo_choices_to_remove.push({
            name: item.name
        });
    });

    let answers = await inquirer.prompt([{
        type: 'checkbox',
        name: 'repos_to_remove',
        message: 'Select the starter kits to remove.',
        choices: repo_choices_to_remove
    }]);

    removeRepoByName(answers.repos_to_remove);
    fs.writeFileSync(kickstartFile, JSON.stringify(repoList));
}


// Selec the repository from the console and clone it

async function cloneRepo() {
    var repo_choices = [];
    repoList.repos.forEach(function (item) {
        repo_choices.push(item.name);
    });

    let answers = await inquirer.prompt([{
        type: 'list',
        name: 'repo_to_clone',
        message: 'Choose a starter kit to clone.',
        choices: repo_choices
    }]);

    const gitUrl = getRepoName(answers.repo_to_clone).url;
    const spinner = new ora({ text: 'Cloning ' + answers.repo_to_clone }).start();

    gitclone(gitUrl, (err) => {
        spinner.stop();        
        if (err) {
            log(chalk.red('There was an error while cloning the repository.'));
        }
        else {
            log(logSymbols.success, "Successfully cloned", answers.repo_to_clone);
        }
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
