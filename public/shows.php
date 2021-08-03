<?php
if(!isset($_SESSION['valid'])||!$_SESSION['valid']){
	exit();
}

$json = file_get_contents('https://electricradio.co.uk/feed/radio/shows/');
$obj = json_decode($json);





foreach ($obj->shows as $show){
	$base64 = '';
	if($show->image_url!=''){
		$imagedata = file_get_contents($show->image_url);
		$base64 = base64_encode($imagedata);
	}
	?>


	<div class="show">
		<div class="showImage">
			<img src="data:image/jpeg;base64,<?= $base64; ?>" />
		</div>
		<div class="showDetails">
			<h3><?php echo $show->name; ?></h3>
            <input class="showCheckbox" type="checkbox" showID="<?php echo $show->id; ?>" name="checkbox<?php echo $show->id; ?>" id="checkbox<?php echo $show->id; ?>" <?php if(in_array($show->id,$settings->include)){echo 'checked';}?> >
            <label for="<?php echo $show->id; ?>">Process this show to MixCloud</label>




		</div>
	</div>
	<br/>
	<?php
}


