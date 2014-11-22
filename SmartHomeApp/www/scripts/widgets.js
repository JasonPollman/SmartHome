/**
 * Created by lismail on 10/22/14.
 */
$(document).ready(function(){

    var user = "lismail";
    var deviceMAC = "00:17:88:14:C7:78";
    var deviceDataPath = '/users/' + user + "/device_configs/" + deviceMAC + "/" +"config/";
    var lightConfigPath = '/users/' + user + "/device_configs/" + deviceMAC + "/" + "groups/1/action/";
    var WeMoMACs= ["08:86:3B:6D:95:25", "08:86:3B:71:32:A1"];
    
    /*Device name header*/
    
    firebaseRef.child(deviceDataPath).once('value', function(data) {
        $('#deviceName').text(data.val().name);
        $('#newDeviceName').attr("placeholder", data.val().name);
    });
    
    /*On device name change via popup update header and firebase*/
    
    $('#newDeviceName').change(function() {
        if ($('#deviceName').text() !== $('#newDeviceName').val()) {
            $('#deviceName').text($('#newDeviceName').val())
            firebaseRef.child(deviceDataPath).update({
            name : $('#newDeviceName').val()
            });
        }
    });

    /*Power button toggle switch*/

    //Update widget based on the current state
    firebaseRef.child(lightConfigPath).once('value', function(data) {
        $("#powerToggle").val(data.val().on).flipswitch("refresh");
    });

    //On change update FB
    $("#powerToggle").change(function(){
        firebaseRef.child(lightConfigPath).update({
            on : $(this).val()
        });
    });
    
    /*Hue slider*/
    
    firebaseRef.child(lightConfigPath).once('value', function(data) {
        $("#h").val(data.val().hue);
        $("#h").slider('refresh');
        updateSwatch();
    });

    //On change update FB and swatch color
    $("#h").change(function(){
        firebaseRef.child(lightConfigPath).update({
            hue : $(this).val()
        });
        //updateSwatch();
    });
    
    /*Saturation slider*/
    
    firebaseRef.child(lightConfigPath).once('value', function(data) {
        $("#s").val(data.val().sat);
        $("#s").slider('refresh');
        updateSwatch();
    });

    //On change update FB
    $("#s").change(function(){
        firebaseRef.child(lightConfigPath).update({
            sat : $(this).val()
        });
        //updateSwatch();
    });

    /*Light brightness slider*/
    
    firebaseRef.child(lightConfigPath).once('value', function(data) {
        $("#l").val(data.val().bri);
        $("#l").slider('refresh');
        updateSwatch();
    });

    //On change update FB
    $("#l").change(function(){
        firebaseRef.child(lightConfigPath).update({
            bri : $(this).val()
        });
        //updateSwatch();
    });
    
    //On change of h||s||l update the color swatch
    $("#h, #s, #l").change(function(){updateSwatch()});
    
    //Updates the swatch div's background color when called based on the values of the hsl sliders
    function updateSwatch() {
        $("#swatch").css("background-color", "hsl(" + ($("#h").val()/182.04) + "," + $("#s").val() + "%," + $("#l").val() + "%)");
    }
});
