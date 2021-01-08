import { bold, cyan, green, red, yellow, magenta } from 'chalk'

const { log } = console

function logBuilder(ctx: string) {
	const time = new Date().toLocaleString()

	return `[ ${ctx} : ${time} ] =>`
}

export function info(message: string) {
	log(cyan(bold(logBuilder('info'))), message)
}

export function success(message: string) {
	log(green(bold(logBuilder('scss'))), message)
}

export function fail(message: string) {
	log(red(bold(logBuilder('fail'))), message)
}

export function warn(message: string) {
	log(yellow(bold(logBuilder('warn'))), message)
}

export function update(message: string) {
	log(magenta(bold(logBuilder('updt'))), message)
}
