/**
 * Created by mbattag4 on 11/5/2014.
 */

/**
 * SmartHome Conflict Resolution Test
 */

// Require the Chai Assertion Library
var expect = require("chai").expect;

// Require the module we are testing...
var SmartHomeAPI = require("../APICore/SmartHomeAPI.js");

describe("Rules Tests\n", function(){


    describe("Checks Something", function(){ //Two cases for pre-state, zero or empty

        it("Should check x for y and z {}\n", function () {

            scan = new SmartHomeAPI.scan()


            scan.on("Logic to check here using objects >>", function(usersObject, userSetting){

                expect(usersObject instanceof Object).to.equal(true);

                expect(userSetting instanceof Object).to.equal(true);


                // TODO: Code logic check here

            });

            scan.on("Logic to check here using objects >>", function(usersObject, userSettings){

                expect(usersObject instanceof Object).to.equal(true);

                expect(userSettings instanceof Object).to.equal(true);

                // TODO: Code logic check here

                // Tell the test we are done testing...
                //done();

            });

        });

    })


});