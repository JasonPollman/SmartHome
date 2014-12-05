$(document).on("pagecreate", "#login", function () {

    $('#register').click(function() { // When the user clicks the "Register" Button...

        FIREBASE_OBJ.createUser({'password' : $('#password').val(),'email' : $('#email').val()}, function(error) {

                if (error) { // Firebase returned an error creating the user...

                  var loginError = $('#loginError');

                  switch (error.code) {
                        case 'EMAIL_TAKEN':

                            // The new user account cannot be created because the email is already in use.
                            // console.log("Error creating user:", error.code);
                            loginError.text("Email address already in use");
                            break;

                        case 'INVALID_EMAIL':

                            // The specified email is not a valid email.
                            // console.log("Error creating user:", error.code);
                            loginError.text("Invalid email address");
                            break;

                        case 'INVALID_PASSWORD':

                            // The specified password is not valid.
                            // console.log("Error creating user:", error.code);
                            loginError.text("Invalid password");
                            break;

                        default:
                            // console.log("Error creating user:", error.code);
                            loginError.text("Error creating user. Please contact the folks at SmartHomeApp.");

                  } // End switch block

                } else { // Firebase successfully created the user, log them in:

                    FIREBASE_OBJ.authWithPassword({'password' : $('#password').val(),'email' : $('#email').val()}, function(error, authData) {

                        if (error === null) { // User successfully authenticated with Firebase

                            // console.log("User ID: " + authData.uid + ", Provider: " + authData.provider);

                            // Set the user
                            $SH_SetUser($('#email').val());
                            FIREBASE_USER_ROOT_OBJ.set({ user_id: authData.uid, user_email: USER_EMAIL });

                            // console.log("User created successfully");
                            $.mobile.changePage( MY_DEVICES_PAGE, { transition: PAGE_TRANSITION_TYPE });

                        } else { // There was a login error...

                            //console.log("Error authenticating newly created user:", error);
                            $('#loginError').text("Error authenticating newly created user. Please contact the folks at SmartHomeApp.");

                        } // End if/else block

                    }); // End FIREBASE_OBJ.authWithPassword()

                } // End if/else block

        }); // End FIREBASE_OBJ.createUser()

    }); // End $('#register').click()

    $('#signin').click(function(){ // When a user clicks the "Sign In" Button

        FIREBASE_OBJ.authWithPassword({'password' : $('#password').val(),'email' : $('#email').val()}, function(error, authData) {

                if (error == null && authData != undefined) { // The user was successfully authenticated...

                    $SH_SetUser($('#email').val());
                    $.mobile.changePage( MY_DEVICES_PAGE, { transition: PAGE_TRANSITION_TYPE});

                }
                else { // There was a problem loggin in the user...

                    var loginError = $('#loginError');

                    // console.log("Error authenticating user:", error);
                    loginError.text("Incorrect username or password.");
                    loginError.append("<br /><button style='background:none;border:none;margin:0;padding:0;' class='smart-color' id='passwordReset'>Send password reset?</button>");
                    
                    //insert password reset link at this point

                } // End if/else block
        });
    });

    $(document).on('click','#passwordReset', function () { // When the user clicks the "Reset Password" link...

        FIREBASE_OBJ.resetPassword({ email : $('#email').val() },
            function(error) {
              if (error === null) {

                // console.log("Password reset email sent successfully");
                $('#loginError').text("Password reset sent.");
                $('#passwordReset').remove();

              } else {

                // console.log("Error sending password reset email:", error);
                $('#loginError').text("Invalid email address");

              } // End if/else block

            }); // End FIREBASE_OBJ.resetPassword()
    });

}); // End $(document).on("pagecreate")


/**
 * To reset a user's password...
 */
$(document).one("pagecreate", function () {

    $(document).on('click','#resetPassButton', function () {

        FIREBASE_OBJ.authWithPassword({'password' : $('#oldPassword').val(),'email' : USER_EMAIL}, function(error, authData) {

            var resetError = $('#resetError');

            if (error === null) {

                // User has been authenticated with Firebase
                // console.log("User ID: " + authData.uid + ", Provider: " + authData.provider);

                if ($('#newPassword').val() === $('#newPasswordAgain').val()) {

                    FIREBASE_OBJ.changePassword({
                        email       : USER_EMAIL,
                        oldPassword : $('#oldPassword').val(),
                        newPassword : $('#newPassword').val()
                    }, function(error) {

                        if (error === null) {
                            resetError.text("Password changed successfully.");
                            resetError.css('visibility', 'visible');
                            // console.log("Password changed successfully.");

                        } else {
                            // console.log("Error changing password:", error);
                            resetError.text("Password was unable to be changed.");
                            resetError.css('visibility', 'visible');
                        }

                    });

                } else {
                    resetError.text("Passwords do not match.");
                    resetError.css('visibility', 'visible');
                    // console.log("Passwords do not match.");

                } // End inner if/else block

            } else {
                // console.log("Error authenticating user:", error);
                resetError.text("Current password is incorrect.");
                resetError.css('visibility', 'visible');

            } // End outer if/else block

        });
    });
});