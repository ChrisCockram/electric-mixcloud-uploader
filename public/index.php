<?php
    session_start();
    if(isset($_SESSION['valid'])&&$_SESSION['valid']){
	    function saveSettings($key,$value){
		    $settings=getSettings();
		    $settings->$key=$value;
		    print_r($settings);
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
    <title>Mixcloud Settings</title>
</head>
<body>

<br>
<div class="container">
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
                            <a href="https://www.mixcloud.com/oauth/authorize?client_id=HzP4JwtYJaE8skCdgv&redirect_uri=http://mixcloud.electricradio.co.uk/mixcloudauth"><button id="LinkMixcloudButton" class="btn btn-primary"><i class="fab fa-mixcloud"></i> Link Mixcloud</button></a>
                            <lable for="LinkMixcloudButton">Link the MixCloud account you wish to upload to.</lable>
                        </div>
                    </form>

                    <h2>Shows</h2>
	                <?php include_once ('shows.php')?>

                    <h2>Logs</h2>
                    <div class="mb-3">
                        <div style="height: 300px; overflow-y: scroll; display: flex; flex-direction: column-reverse;">
                            <?php include_once ('logs.php')?>
                        </div>
                    </div>

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
    function update(id){
        alert(id);
    }
</script>

</body>
</html>