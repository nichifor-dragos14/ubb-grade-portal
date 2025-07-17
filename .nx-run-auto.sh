#!bin/bash
export FORCE_COLOR=true

if [ $# -eq 1 ]
then
    nx run-many --all \
                --parallel=16 \
                --output-style=stream \
                --target="${@:1:1}" \
        | sed -r 's/←/\e/g' # this reverts ansi code escape
elif [ $# -eq 2 ]
then
    nx run "${@:1:1}:${@:2:2}" \
        | sed -r 's/←/\e/g' # this reverts ansi code escape
else
    nx run-many --parallel=16 \
                --output-style=stream \
                --target="${@:1:1}" \
                --projects="${@:2:99}" \
        | sed -r 's/←/\e/g' # this reverts ansi code escape
fi