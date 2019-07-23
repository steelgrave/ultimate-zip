import LocalHeader from './local-header'
import {LOC_SIG} from './constants'
import {LOC_SPO} from './constants'
import {LOC_VER} from './constants'
import {LOC_PLT} from './constants'
import {LOC_FLG} from './constants'
import {LOC_MTD} from './constants'
import {LOC_TIM} from './constants'
import {LOC_DAT} from './constants'
import {LOC_CRC} from './constants'
import {LOC_SIC} from './constants'
import {LOC_SIU} from './constants'
import {LOC_FLE} from './constants'
import {LOC_ELE} from './constants'
import {LOC_HDR} from './constants'
import {LOC_MAX} from './constants'

export default class LocalHeaderDecoder {

    _buffer = Buffer.alloc(LOC_MAX)
    _offset = 0

    update = (chunk) => {

        if (this._offset < LOC_HDR) {

            const remainingBytes = LOC_HDR - this._offset
            const bytesRead = chunk.copy(this._buffer, this._offset, 0, remainingBytes)
            this._offset += bytesRead

            if (this._offset !== LOC_HDR)
                return null

            chunk = chunk.slice(bytesRead)

            this._nameLen = this._buffer.readUInt16LE(LOC_FLE)
            this._extraLen = this._buffer.readUInt16LE(LOC_ELE)
            this._bufferLength = LOC_HDR + this._nameLen + this._extraLen
        }

        const remainingBytes = this._bufferLength - this._offset
        const bytesRead = chunk.copy(this._buffer, this._offset, 0, remainingBytes)
        this._offset += bytesRead

        if (this._offset !== this._bufferLength)
            return null

        return chunk.slice(bytesRead)
    }

    decode = () => {

        const signature = this._buffer.readUInt32LE(LOC_SPO)

        if (signature !== LOC_SIG) {

            const actualSignature = '0x' + signature.toString(16).toUpperCase().padStart(8, '0')
            const expectedSignature = '0x' + LOC_SIG.toString(16).toUpperCase().padStart(8, '0')

            throw (`Local file header signature could not be confirmed: actual ${actualSignature} expected ${expectedSignature}`)
        }

        this._offset = 0

        const header = new LocalHeader()

        header.setVersionNeededToExtract(this._buffer.readUInt8(LOC_VER))
        header.setPlatformNeededToExtract(this._buffer.readUInt8(LOC_PLT))
        header.setGeneralPurposeBitFlag(this._buffer.readUInt16LE(LOC_FLG))
        header.setCompressionMethod(this._buffer.readUInt16LE(LOC_MTD))
        header.setLastModFileTime(this._buffer.readUInt16LE(LOC_TIM))
        header.setLastModFileDate(this._buffer.readUInt16LE(LOC_DAT))
        header.setCRC32(this._buffer.readUInt32LE(LOC_CRC))
        header.setCompressedSize(this._buffer.readUInt32LE(LOC_SIC))
        header.setUncompressedSize(this._buffer.readUInt32LE(LOC_SIU))
        header.setFileNameLength(this._nameLen)
        header.setExtraFieldLength(this._extraLen)

        header.setFileName(this._buffer.toString('utf8', LOC_HDR, LOC_HDR + this._nameLen))

        const extraBuf = Buffer.allocUnsafe(this._extraLen)
        this._buffer.copy(extraBuf, 0, LOC_HDR + this._nameLen, LOC_HDR + this._nameLen + this._extraLen)
        header.setExtraField(extraBuf)

        header.setHeaderLength(this._bufferLength)

        return header
    }
}