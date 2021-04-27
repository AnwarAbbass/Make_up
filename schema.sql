drop table if exists product;
create table product(
    id serial primary key,
    image varchar(255),
    name varchar(255),
    price varchar(255),
    description varchar(255)
);