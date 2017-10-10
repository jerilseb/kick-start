'use strict';

// Read from the console and 
// add a repository to the JSON file

let addRepo = (() => {
    var _ref = _asyncToGenerator(function* () {
        let answers = yield inquirer.prompt([{
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
    });

    return function addRepo() {
        return _ref.apply(this, arguments);
    };
})();

// Read from the console and 
// remove a repository from the JSON file

let removeRepo = (() => {
    var _ref2 = _asyncToGenerator(function* () {
        var repo_choices_to_remove = [];
        repoList.repos.forEach(function (item) {
            repo_choices_to_remove.push({
                name: item.name
            });
        });

        let answers = yield inquirer.prompt([{
            type: 'checkbox',
            name: 'repos_to_remove',
            message: 'Select the starter kits to remove.',
            choices: repo_choices_to_remove
        }]);

        removeRepoByName(answers.repos_to_remove);
        fs.writeFileSync(kickstartFile, JSON.stringify(repoList));
    });

    return function removeRepo() {
        return _ref2.apply(this, arguments);
    };
})();

// Selec the repository from the console and clone it

let cloneRepo = (() => {
    var _ref3 = _asyncToGenerator(function* () {
        var repo_choices = [];
        repoList.repos.forEach(function (item) {
            repo_choices.push(item.name);
        });

        let answers = yield inquirer.prompt([{
            type: 'list',
            name: 'repo_to_clone',
            message: 'Choose a starter kit to clone.',
            choices: repo_choices
        }]);

        const gitUrl = getRepoName(answers.repo_to_clone).url;
        const spinner = new ora({ text: 'Cloning ' + answers.repo_to_clone }).start();

        gitclone(gitUrl, function (err) {
            spinner.stop();
            if (err) {
                log(chalk.red('There was an error while cloning the repository.'));
            } else {
                log(chalk.green("  Successfully cloned"));
            }
        });
    });

    return function cloneRepo() {
        return _ref3.apply(this, arguments);
    };
})();

// Check if the repository is already added to the JSON file.
// If yes, return the entry, else return 'undefined'

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const fs = require('fs-extra');
const program = require('commander');
const inquirer = require('inquirer');
const gitclone = require('gitclone');
const path = require('path');
const userHome = require('user-home');
const chalk = require('chalk');
const ora = require('ora');
const log = console.log;

let repoList = null;
createStore();

program.version('1.0.0').option('-a, --add', 'Add a repository').option('-r, --remove', 'Remove a repository').parse(process.argv);

if (program.add) addRepo();else if (program.remove) removeRepo();else {
    if (repoList === null || repoList.repos.length === 0) {
        log(chalk.cyan("No starter kits available. Use the -a option to add a new one"));
    } else {
        cloneRepo();
    }
}

// Create a JSON file to store the list of 
// repositories in the user's home directory

function createStore() {
    const kickstartDir = path.join(userHome, '.kickstart');
    const kickstartFile = path.join(kickstartDir, 'repoList.json');
    fs.ensureFileSync(kickstartFile);

    repoList = fs.readJsonSync(kickstartFile, { throws: false });
    if (repoList === null) {
        repoList = {
            repos: []
        };
        fs.writeFileSync(kickstartFile, JSON.stringify(repoList));
    }
}function getRepoName(repoName) {
    return repoList.repos.find(_repo => _repo.name == repoName);
}

// Remove a repository from the JSON file

function removeRepoByName(repoName) {
    let index = repoList.repos.findIndex(_repo => _repo.name == repoName);
    repoList.repos.splice(index, 1);
}
