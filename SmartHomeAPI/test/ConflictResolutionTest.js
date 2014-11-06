/**
 * Created by mbattag4 on 11/5/2014.
 */

/**
 * SmartHome Conflict Resolution Test
 */

// Require the Chai Assertion Library
var expect = require("chai").expect;

// Require the module we are testing...
var ConflictResolution = require("../APICore/ConflictResolution.js");

describe("Conflict Resolution Tests\n", function(){


    describe("State checks on input parameter logic", function(){ //Two cases for pre-state, zero or empty

        it("Should set the last user object to the current object if state is zero or empty {}\n", function () {

            scan = new ConflictResolution.scan()


            scan.on("Conflict Resolution pre-state logic", function(usersObject, userSetting){

                expect(usersObject instanceof Object).to.equal(true);

                expect(userSetting instanceof Object).to.equal(true);


                // TODO: Check to see if lastUsersObject is empty, if so check that is gets initiated by original state

            })

            scan.on("Conflict Resolution post-state logic", function(usersObject, userSettings){

                expect(usersObject instanceof Object).to.equal(true);

                expect(userSettings instanceof Object).to.equal(true);

                // TODO: Check if logic makes sense after conflict resolution code deals with issue


            });

        });

    })




});

