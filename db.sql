create database elearning;
use elearning;

create table users(
id INT(6) NOT NULL AUTO_INCREMENT PRIMARY KEY,
username VARCHAR(32) NOT NULL,
password VARCHAR(32) NOT NULL,
email VARCHAR(50) NOT NULL,
ip varchar(32) NOT NULL
)AUTO_INCREMENT=1 ;

create table rooms(
id int(6) NOT NULL AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(32) NOT NULL,
adminName VARCHAR(32) NOT NULL,
link VARCHAR(100) NOT NULL,
roomKey VARCHAR(32) NOT NULL,
userId int(6) NOT NULL
)AUTO_INCREMENT=1 ;

create table messages(
id varchar(6) NOT NULL PRIMARY KEY,
text varchar(1000) NOT NULL,
roomId varchar(6) NOT NULL,
userId int(6) NOT NULL,
date datetime NOT NULL
);

create table rooms_users(
roomId int(6) NOT NULL,
userId int(6) NOT NULL
);
ALTER TABLE rooms_users ADD CONSTRAINT fk_rooms_users FOREIGN KEY(roomId) REFERENCES rooms(id);
ALTER TABLE rooms_users ADD CONSTRAINT fk_users_rooms FOREIGN KEY(userId) REFERENCES users(id);
ALTER TABLE messages ADD CONSTRAINT fk_mess_user FOREIGN KEY(userId) REFERENCES users(id);