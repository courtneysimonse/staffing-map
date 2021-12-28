<?php
    /*
    Script for update record from X-editable.
    */

    //delay (for debug only)
    sleep(1);

    // print_r($_POST);
    echo $_POST;

    /*
    You will get 'pk', 'name' and 'value' in $_POST array.
    */
    $data = file_get_contents('php://input');
    print_r($data);

    $jsonans = json_decode($data, true);

    /*
     Check submitted value
    */
    // if(true) {
        $filename = 'candidates.csv';

        // open csv file for writing
        $f = fopen($filename, 'w');

        if ($f === false) {
          die('Error opening the file ' . $filename);
        }

        fputcsv($f, array('ID','FIRST NAME','LAST NAME','ADDRESS','CITY','STATE','ZIP','TEMP ID','POSITION','PAY','SHIFT','CAR','STATUS' ));
        // write each row at a time to a file
        foreach ($jsonans as $i) {
          fputcsv($f, $i);
        }

        // close the file
        fclose($f);

        //here, for debug reason we just return dump of $_POST, you will see result in browser console
        // print_r($_POST);


    // }
    // else {
    //     /*
    //     In case of incorrect value or error you should return HTTP status != 200.
    //     Response body will be shown as error message in editable form.
    //     */
    //
    //     header('HTTP/1.0 400 Bad Request', true, 400);
    //     echo "This field is required!";
    // }

?>
