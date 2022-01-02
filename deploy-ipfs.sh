#!/bin/bash

nodes=("copenhagen.pez.sh 22" "london.pez.sh 2221" "london.pez.sh 2222" "london.pez.sh 2223" "london.pez.sh 2224")

# for each node in nodes
for node in "${nodes[@]}"
do
    # deploy ipfs
    export hostname=`echo $node | awk '{print $1}'`
    export port=`echo $node | awk '{print $2}'`
    ssh -i ~/.ssh/id_rsa -o StrictHostKeyChecking=no -p $port pez@$hostname "rm -rf /tmp/ipfs && mkdir -p /tmp/ipfs"
    scp -i ~/.ssh/id_rsa -o StrictHostKeyChecking=no -P $port -r ./public pez@$hostname:/tmp/ipfs/public
    ssh -i ~/.ssh/id_rsa -o StrictHostKeyChecking=no -p $port pez@$hostname -- ipfs add -r /tmp/ipfs/public | tail -n 1 | awk '{print $2}' | ipfs pin add -r
done
