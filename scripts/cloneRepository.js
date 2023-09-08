async function main() {}

main()
    .then(() => {
        process.exit(0);
    })
    .error((error) => {
        console.log(error);
        process.exit(1);
    });
