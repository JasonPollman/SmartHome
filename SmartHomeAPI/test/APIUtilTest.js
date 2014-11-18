/**
 * Created by mbattag4 on 11/5/2014.
 */

/**
 * SmartHome Conflict Resolution Test
 */

// Require the Chai Assertion Library
var expect = require("chai").expect;

// Require the module we are testing...
var APIUtilTest = require("../APICore/APIUtil.js");

var test;

describe("Conflict Resolution Tests\n", function(){


    describe("State checks on input parameter logic", function(){ //Two cases for pre-state, zero or empty

        it("Should return a captial T \n", function () {
            expect(test.charAt(0)).to.equal("T");
        })

        it("Should be a string\n", function(){

            expect(test).to.be.a('string');

            })
        it("Should check to see if object is being cloned correctly", function(){
           //todo
        })

        it("Should check to see if 0's are appending to object", function(){
            //todo
        })

        });

});

