-- T-Mobile first, Three UK third in redeem network picker.
UPDATE `Network` SET `displayOrder` = 1 WHERE `slug` = 't_mobile';
UPDATE `Network` SET `displayOrder` = 3 WHERE `slug` = 'three_uk';
