<?php
    session_start();
    if(isset($_SESSION['valid'])&&$_SESSION['valid']){

	    $settings = file_get_contents('../settings.json');
	    $settings = json_decode($settings);


	    function saveSettings($key,$value){
		    $settings=getSettings();
		    $settings->$key=$value;
		    $fp = fopen('../settings.json', 'w');
		    fwrite($fp, json_encode($settings));
		    fclose($fp);
	    }
	    function getSettings(){
		    $settings = file_get_contents("../settings.json");
		    $settings = json_decode($settings);
		    return $settings;
	    }
	    $settings=getSettings();

	    if(isset($_POST['set'])){
		    saveSettings($_POST['set'],$_POST['val']);
		    echo 'success';
		    exit();
        }

	    if(isset($_POST['showID'])){
            if($_POST['active']=='true'){
                if(!in_array($_POST['showID'],$settings->include)){
		            $settings->include[]=$_POST['showID'];
	                saveSettings('include',$settings->include);
	                echo 'success';
                }
            }else{
	            if(in_array($_POST['showID'],$settings->include)){
                    $newarr=array();
                    foreach ($settings->include as $id){
                        if($id != $_POST['showID']){
                            $newarr[]=$id;
                        }
                    }

		            saveSettings('include',$newarr);
		            echo 'success';
	            }
            }
	        exit();
	    }
    }
    ?>
<!doctype html>
<html lang="en">
<head>
    <!-- Required meta tags -->
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" integrity="sha512-iBBXm8fW90+nuLcSKlbmrPcLa0OT92xO1BIsZ+ywDWZCvqsWgccV3gFoRBv0z+8dLJgyAHIhR35VZc2oM/gI1w==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-+0n0xVW2eSR5OomGNYDnhzAbDsOXxcvSN1TPprVMTNDbiYZCxYbOOl7+AMvyTG2x" crossorigin="anonymous">
    <link rel="stylesheet" href="default.css">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
    <title>Mixcloud Settings</title>
</head>
<body>


<br>
<div class="container">
    <div class="row">
        <div class="col"><img class="logo"  src="Logo.png"></div>
    </div>
    <div class="row">

        <div class="col">
            <?php
            if(isset($_SESSION['valid'])&&$_SESSION['valid']){
                ?>
                    <h1>Mixcloud Settings</h1>
                    <div class="mb-3">
                        <a href="auth.php"><button class="btn btn-danger"><i class="fas fa-sign-out-alt"></i> Log Out</button> </a>
                    </div>
                    <br>
                    <form >
                        <div class="mb-3">



                           <button onclick="window.open('https://www.mixcloud.com/oauth/authorize?client_id=HzP4JwtYJaE8skCdgv&redirect_uri=http://mixcloud.electricradio.co.uk/mixcloudauth.php');" id="LinkMixcloudButton" class="btn btn-primary"><i class="fab fa-mixcloud"></i> Link Mixcloud</button>

                            <!--<a href="https://www.mixcloud.com/oauth/authorize?client_id=HzP4JwtYJaE8skCdgv&redirect_uri=http://mixcloud.electricradio.co.uk/mixcloudauth.php" target="_blank"><button id="LinkMixcloudButton" class="btn btn-primary"><i class="fab fa-mixcloud"></i> Link Mixcloud</button></a>-->
                            <lable for="LinkMixcloudButton">Link the MixCloud account you wish to upload to.</lable>

                            <?php if($settings->MIXCLOUD_API_ACCESS_TOKEN!=""){
                                $url="https://api.mixcloud.com/me/?access_token=".$settings->MIXCLOUD_API_ACCESS_TOKEN;
	                            $json = file_get_contents($url);
	                            $obj = json_decode($json);
	                            print_r($obj);
	                            ?>
                                    <img src="<?php echo $obj->pictures->medium;?>">
                                    <b>Account:</b><?php echo $obj->name; ?>
                                    <b>Username:</b><?php echo $obj->username; ?>

                                <?php
                            }?>

                        </div>
                    </form>

                    <h2>Logs</h2>
                    <div class="mb-3">
                        <div style="height: 300px; overflow-y: scroll; display: flex; flex-direction: column-reverse;">
                            <?php include_once ('logs.php')?>
                        </div>
                    </div>

                    <h2>Time Offset</h2>
                    Use this setting to allow for any delay in the stream.
                    <br/>
                    <select id="offset_sign"><option <?php if($settings->OFFSET_SIGN==="1"){echo "selected";} ?> value="1">+</option><option <?php if($settings->OFFSET_SIGN==="0"){echo "selected";} ?> value="0">-</option></select>
                    <input type="number" id="offset_seconds" value="<?php echo $settings->OFFSET_SECONDS; ?>"> Seconds
                    <br/>
                    <br/>
                    <h2>Shows</h2>
                    <div id="showsLoading">Loading Shows...</div>
                    <div id="shows" style="display: none;"><?php include_once ('shows.php')?></div>


                <?php
            }else{
                ?>
            <h1>Mixcloud Settings Login Form</h1>

            <form method="post" action="auth.php">
                <div class="mb-3">
                    <label for="username" class="form-label">Username</label>
                    <input type="text"  class="form-control" name="username" id="username" placeholder="Username" required>
                </div>
                <div class="mb-3">
                    <label for="password" class="form-label">Password</label>
                    <input type="password" class="form-control" name="password" id="password" placeholder="Password" required>
                </div>
                <button type="submit" class="btn btn-primary">Submit</button>
            </form>


	            <?php
            }
            ?>

        </div>

    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.1/dist/js/bootstrap.bundle.min.js" integrity="sha384-gtEjrD/SeCtmISkJkNUaaKMoLD0//ElJ19smozuHV6z3Iehds+3Ulb9Bn9Plx0x4" crossorigin="anonymous"></script>
<script>
    $( document ).ready(function() {
        $("#showsLoading").slideUp(500);
        $("#shows").slideDown(500);
        console.log( "ready!" );
    });

    $('.showCheckbox').change(function() {
        $.post("index.php",
            {
                showID:$(this).attr("showID"),
                active:this.checked
            },
            function(data, status){
                if(data!='success'){
                    alert("Data: " + data + "\nStatus: " + status);
                }
            }
        );
    });


    $('#offset_sign').change(function() {
        console.log(this.value);
        $.post("index.php",
            {
                set:"OFFSET_SIGN",
                val:this.value
            },
            function(data, status){
                if(data!='success'){
                    alert("Data: " + data + "\nStatus: " + status);
                }
            }
        );
    });

    $('#offset_seconds').change(function() {
        console.log(this.value);
        $.post("index.php",
            {
                set:"OFFSET_SECONDS",
                val:this.value
            },
            function(data, status){
                if(data!='success'){
                    alert("Data: " + data + "\nStatus: " + status);
                }
            }
        );
    });

</script>



</body>
</html>