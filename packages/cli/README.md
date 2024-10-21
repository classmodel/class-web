# @classmodel/cli 

The CLASS model as command line interface (CLI).

For more information on CLASS, see https://classmodel.github.io/.

## Usage

The class model can be run from the command line.
The argument is the config file that should adhere to the [JSON schema](./packages/class/src/config.json).

```shell
# Generate default config file
pnpx @classmodel/cli generate --output config.json

# Run the model
pnpx @classmodel/cli run config.json
# Outputs h variable for each timestep in JSON format

# To output csv use
pnpx @classmodel/cli run --output output.csv --formtat csv config.json

# To read from stdin use
cat config.json | pnpx @classmodel/cli -
```

In development use `pnpx tsx src/cli.ts ./config.json`.

To use the reference configuration of a experiment downloaded from the web application use.

```shell
jq .reference < ~/Downloads/class-MyExperiment.json  > config.json
```
