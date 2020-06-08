import { BlockMap } from "builder-util-runtime/out/blockMapApi";
import { DifferentialDownloader } from "./DifferentialDownloader";

export class GenericDifferentialDownloader extends DifferentialDownloader {
  download(
    oldBlockMap: BlockMap,
    newBlockMap: BlockMap,
    emit: Function
  ): Promise<any> {
    return this.doDownload(oldBlockMap, newBlockMap, emit);
  }
}
