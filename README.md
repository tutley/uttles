This is based on [MeanJs](http://meanjs.org/)

## About

Uttles is a website I made to learn more about the full-stack javascript ecosystem M.E.A.N. - MongoDB, ExpressJS, AngularJS, and NodeJS.

You can check it out at http://uttles.com

Since making the site, I haven't really done anything with it. I think it's a good idea though so I thought I would just set it free to the world.

From the site:

    A Uttle is your own personal editorial about anything on the web.

    To create a Uttle, you click the "Create" button and give us the URL to whatever it is that you want to talk about. It can be anything really: a link to an article, a picture, a video, a file, a tweet, a blog post, a movie, or anything. Then you simply write your remarks about the item, and you're all done.

    When you create a Uttle, you make an object on the web that you can then share with others quickly and easily. Do you want to tweet your opinion on something but it's more than 140 characters? Make a Uttle, and tweet it. Do you want to post your opinion about something, but don't want the audience limited? Make a Uttle and share it.

    In addition, we link together Uttles about the same subect matter so that you can see what other people think that aren't necessarily in your sphere of thought. Why? Why not?


## Notes

Use PM2 to run in production on server:
pm2 start grunt --name website -- serve


## Run Dev
```
$ grunt
```

Your application should run on port 3000 with the *development* environment configuration, so in your browser just go to [http://localhost:3000](http://localhost:3000)

* explore `config/env/development.js` for development environment configuration options

### Running in Production mode

```bash
$ grunt prod
```

* explore `config/env/production.js` for production environment configuration options

### Running with User Seed
To have default account(s) seeded at runtime:

In Development:
```bash
MONGO_SEED=true grunt
```
It will try to seed the users 'user' and 'admin'. If one of the user already exists, it will display an error message on the console. Just grab the passwords from the console.

In Production:
```bash
MONGO_SEED=true grunt prod
```
This will seed the admin user one time if the user does not already exist. You have to copy the password from the console and save it.

## Testing Your Application
You can run the full test suite included with MEAN.JS with the test task:

```bash
$ grunt test
```

This will run both the server-side tests (located in the app/tests/ directory) and the client-side tests (located in the public/modules/*/tests/).

To execute only the server tests, run the test:server task:

```bash
$ grunt test:server
```

And to run only the client tests, run the test:client task:

```bash
$ grunt test:client
```

