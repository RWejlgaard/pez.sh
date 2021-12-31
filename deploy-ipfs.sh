#!/bin/bash

nodes=("copenhagen.pez.sh")

# for each node in nodes
for node in "${nodes[@]}"
do
    # deploy ipfs
    ssh -i ~/.ssh/id_rsa -o StrictHostKeyChecking=no pez@$node "rm -rf /tmp/ipfs && mkdir -p /tmp/ipfs"
    scp -i ~/.ssh/id_rsa -o StrictHostKeyChecking=no -r ./public pez@$node:/tmp/ipfs/public
    ssh -i ~/.ssh/id_rsa -o StrictHostKeyChecking=no pez@$node -- ipfs add -r /tmp/ipfs/public | tail -n 1 | awk '{print $2}' | ipfs pin add -r
done
