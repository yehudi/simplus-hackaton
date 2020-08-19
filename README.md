# GETTING STARTED

In order to start your project install dependencies
```
yarn install
```

or with npm

```
npm install
```

In order to run the project test run :

```
yarn start
```

or with npm 

```
npm start
```

Make sure you run the latest version of node and to install typescript and ts-node

```
npm install -g typescript ts-node
```

# Folder structure

The main function you need to develop sits in the ./src/index.ts file but you can add as many files as you need.
The index function contains example of library functions usage.
The library folder contains utility function that will help you go faster in your implementation

## library/globals

Contains your global variables

## library/io

Contains the utilities to read input and write result

## library/memory

Contains utilities to write items to database, we highly recommend to use those utilities since they are part of the constraint of the problem

## library/models

Contains all the models required to write your code (event classes for outputs and breadcrumb description for inputs)

## input.csv
Contains an example of input

## output.csv
contains an example of output