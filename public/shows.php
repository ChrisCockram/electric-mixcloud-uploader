<?php

$json = file_get_contents('https://electricradio.co.uk/feed/radio/shows/');
$obj = json_decode($json);


$settings = file_get_contents('../settings.json');
$settings = json_decode($settings);

//print_r($settings);
print_r($settings->include);


foreach ($obj->shows as $show){

	if($show->image_url!=''){
		$imagedata = file_get_contents($show->image_url);
		$base64 = base64_encode($imagedata);
	}else{
		$base64 = '';
	}
	?>


	<div class="show">
		<div class="showImage">
			<img src="data:image/jpeg;base64,<?= $base64; ?>" />
		</div>
		<div class="showDetails">
			<h3><?php echo $show->name; ?></h3>

            <input class="showCheckbox" type="checkbox" onchange="update('<?php echo $show->id; ?>')" name="checkbox<?php echo $show->id; ?>" id="checkbox<?php echo $show->id; ?>">
            <label for="<?php echo $show->id; ?>">Process this show to MixCloud</label>



            <?php if(in_array($show->id,$settings->include)){
                ?>

                <?php }else{ ?>

            <?php } ?>
		</div>
	</div>
	<br/>
	<?php
}


