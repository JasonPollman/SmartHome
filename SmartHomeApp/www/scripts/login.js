$(document).on("pagecreate", "#login", function () {
$('#register').click(
    function(){
        FIREBASE_OBJ.createUser({'password' : $('#password').val(),'email' : $('#email').val()}, function(error) {
                if (error) {
                  switch (error.code) {
                        case 'EMAIL_TAKEN':
                            // The new user account cannot be created because the email is already in use.
                            console.log("Error creating user:", error.code);
                            $('#loginError').text("Email address already in use");
                            break;
                        case 'INVALID_EMAIL':
                            // The specified email is not a valid email.
                            console.log("Error creating user:", error.code);
                            $('#loginError').text("Invalid email address");
                            break;
                        case 'INVALID_PASSWORD':
                            // The specified password is not valid.
                            console.log("Error creating user:", error.code);
                            $('#loginError').text("Invalid password");
                            break;
                        default:
                            console.log("Error creating user:", error.code);
                            $('#loginError').text("Error creating user. Please contact the folks at SmartHomeApp.");
                    }                  
                } else {
                    FIREBASE_OBJ.authWithPassword({'password' : $('#password').val(),'email' : $('#email').val()}, function(error, authData) {
                            if (error === null) {
                                // user authenticated with Firebase
                                console.log("User ID: " + authData.uid + ", Provider: " + authData.provider);
                                FIREBASE_USER_DIR_OBJ.child(authData.uid).set("");
                                //USER  = authData.uid;
                                USER_EMAIL = $('#email').val();
                                console.log("User created successfully");
                                $.mobile.changePage( MY_DEVICES_PAGE, { transition: PAGE_TRANSITION_TYPE});
                              } else {
                                console.log("Error authenticating newly created user:", error);
                                $('#loginError').text("Error authenticating newly created user. Please contact the folks at SmartHomeApp.");
                              }
                    });
                }
        });
    });

$('#signin').click(
    function(){
        FIREBASE_OBJ.authWithPassword({'password' : $('#password').val(),'email' : $('#email').val()}, function(error, authData) {
                if (error === null) {
                    // user authenticated with Firebase
                    console.log("User ID: " + authData.uid + ", Provider: " + authData.provider);
                    //USER  = authData.uid;
                    USER_EMAIL = $('#email').val();
                    $.mobile.changePage( MY_DEVICES_PAGE, { transition: PAGE_TRANSITION_TYPE});
                    //$.mobile.changePage(redirectTo || MY_DEVICES_PAGE);
                  } else {
                    console.log("Error authenticating user:", error);
                    $('#loginError').text("Incorrect username or password.");
                    $('#loginError').append("<button style='background:none;border:none;margin:0;padding:0;' class='smart-color' id='passwordReset'>Send password reset?</button>");
                    
                    //insert password reset link at this point
                  }
        });
    });
$(document).on('click','#passwordReset',
    function(){
        FIREBASE_OBJ.resetPassword({
            email : $('#email').val()
          }, function(error) {
          if (error === null) {
            console.log("Password reset email sent successfully");
            $('#loginError').text("Password reset sent.");
            $('#passwordReset').remove();
          } else {
            console.log("Error sending password reset email:", error);
            $('#loginError').text("Invalid email address");
          }
        });
    });
});

$(document).on("pagecreate", "#changePass", function () {
    $(document).on('click','#resetPassButton', function(){
        FIREBASE_OBJ.authWithPassword({'password' : $('#oldPassword').val(),'email' : USER_EMAIL}, function(error, authData) {
                if (error === null) {
                    // user authenticated with Firebase
                    console.log("User ID: " + authData.uid + ", Provider: " + authData.provider);
                    if ($('#newPassword').val() === $('#newPasswordAgain').val()) {
                        FIREBASE_OBJ.changePassword({
                            email       : USER_EMAIL,
                            oldPassword : $('#oldPassword').val(),
                            newPassword : $('#newPassword').val()
                          }, function(error) {
                            if (error === null) {
                              $('#resetError').text("Password changed successfully.");
                              $('#resetError').css('visibility', 'visible');
                              console.log("Password changed successfully.");
                            } else {
                              console.log("Error changing password:", error);
                              $('#resetError').text("Password was unable to be changed.");
                              $('#resetError').css('visibility', 'visible');
                            }
                        });
                    } else {
                        $('#resetError').text("Passwords do not match.");
                        $('#resetError').css('visibility', 'visible');
                        console.log("Passwords do not match.");
                    }

                  } else {
                    console.log("Error authenticating user:", error);
                    $('#resetError').text("Current password is incorrect.");
                    $('#resetError').css('visibility', 'visible');
                  }
        });
    
    });
});