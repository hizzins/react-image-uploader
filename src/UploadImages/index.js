import React, { useEffect, createRef, useState } from 'react';
import PropTypes from 'prop-types';
import produce from 'immer';
import styles from './UploadImages.module.scss';

const UploadImages = ({
  filesInfo,
  customClass,
  placeholder,
  customPreview,
  multiple,
  maxSize,
  showSize,
  onChange,
}) => {
  const [errorMessage, setErrorMessage] = useState('');
  const bytePerMegabyte = 1048576;
  // const maxFileSize = bytePerMegabyte * maxSize;
  const { files, totalSize } = filesInfo;
  const [fileUploader] = useState(() => createRef());
  const fileSize =
    totalSize < bytePerMegabyte
      ? Math.ceil((totalSize * 100) / bytePerMegabyte) / 100
      : Math.floor(totalSize / bytePerMegabyte);

  const revokeObjectURL = (imageUrl) => {
    const urlCreator = window.URL || window.webkitURL;

    urlCreator.revokeObjectURL(imageUrl);
  };
  useEffect(
    () => () => {
      if (filesInfo.files) {
        for (const file of filesInfo.files) {
          revokeObjectURL(file.url);
        }
      }
    },
    []
  );

  const makeHeader = (fileArr) => {
    let header = '';

    for (let i = 0; i < fileArr.length; i += 1) {
      header += fileArr[i].toString(16);
    }

    return header;
  };

  const getMimeType = (headerString) => {
    let type = 'unknown';
    switch (headerString) {
      case '89504e47':
        type = 'image/png';
        break;
      case '47494638':
        type = 'image/gif';
        break;
      case 'ffd8ffe0':
      case 'ffd8ffe1':
      case 'ffd8ffe2':
        type = 'image/jpeg';
        break;
      default:
        type = 'unknown';
        break;
    }
    return type;
  };

  const updateProgress = (e) => {
    console.log('+++handleUpdateProgress', e);
    if (e.lengthComputable) {
      // evt.loaded and evt.total are ProgressEvent properties
      const isCompelete = e.loaded === e.total;
      if (isCompelete) {
        console.log('완료');
      }
    }
  };

  const factorFileData = (fileReader) => {
    // Obtain the read file data
    const fileData = fileReader.result;
    const fileArr = new Uint8Array(fileData).subarray(0, 4);
    const header = makeHeader(fileArr);
    const mimeType = getMimeType(header);

    if (mimeType !== 'image/png' && mimeType !== 'image/gif' && mimeType !== 'image/jpeg') {
      // alert('이미지파일만 업로드 됩니다.(jpg, png, gif)');
      setErrorMessage('이미지파일만 업로드 됩니다.(jpg, png, gif)');
      return { error: '이미지파일만 업로드 됩니다.(jpg, png, gif)' };
    }
    return { success: fileReader };
  };

  const getFile = (readFile) => {
    // const { totalSize } = filesInfo;

    // if (totalSize + readFile.size > maxFileSize) {
    //   alert(`최대 ${maxSize}MB까지 업로드 가능합니다.`);
    //   fileUploader.current.value = '';
    //   return false;
    // }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.uploadedFile = readFile;
      reader.size = readFile.size;
      reader.readAsArrayBuffer(readFile);
      reader.onprogress = updateProgress;
      reader.onload = (e) => {
        resolve(e.target);
      };
      reader.onerror = reject;
    });
  };

  const makeFilesInfo = (fileReaders) => {
    const newFiles = [];
    let newSize = 0;

    for (const file of fileReaders) {
      const { size, result } = file;
      const arrayBufferView = new Uint8Array(result);
      const blob = new Blob([arrayBufferView], { type: 'image/jpeg' });
      const urlCreator = window.URL || window.webkitURL;
      const imageUrl = urlCreator.createObjectURL(blob);
      const newFile = { key: new Date().getTime(), url: imageUrl, size };
      newFiles.push(newFile);
      newSize += size;
    }

    if (multiple) {
      const newTotalSize = newSize + totalSize;
      const newState = produce(filesInfo, (draft) => {
        draft.files.push(...newFiles);
        draft.totalSize = newTotalSize;
      });
      return newState;
    }
    return { files: newFiles, totalSize: newSize };
  };

  async function startRead(e) {
    const uploadFiles = e.target.files;
    const results = [];
    const successData = [];

    // initialize error message
    setErrorMessage('');

    if (uploadFiles) {
      // 파일리더 정보 읽기
      for (let i = 0; i < uploadFiles.length; i += 1) {
        const reader = new FileReader();
        const getFileInfo = getFile(uploadFiles[i], reader);
        results.push(getFileInfo);
      }
    }

    const complateData = await Promise.all(results);

    for (const data of complateData) {
      const d = factorFileData(data);
      if (d.success) {
        successData.push(d.success);
      }
    }

    fileUploader.current.value = '';
    onChange(makeFilesInfo(successData));
  }

  const onDelete = (e, key) => {
    console.log('onDelete', e, key);
    const newFiles = [];
    let newTotalSize = 0;

    // initialize error message
    setErrorMessage('');

    for (const file of files) {
      if (file.key !== key) {
        newFiles.push(file);
      } else {
        newTotalSize = totalSize - file.size;
        // 메모리 해제
        revokeObjectURL(key);
      }
    }
    fileUploader.current.value = '';
    onChange({ files: newFiles, totalSize: newTotalSize });
  };

  return (
    <div className={`${styles.wrapImageUpload} upload-image`}>
      {showSize && (
        <div
          className={`${styles.sizeProgress} ${fileSize > maxSize ? 'error' : ''}`}
        >{`${fileSize} / ${maxSize} MB`}</div>
      )}

      <div className={`${styles.uploadImage} ${customClass} wrap-upload-input`}>
        <input multiple={multiple} className="upload-input" type="file" onChange={startRead} ref={fileUploader} />
        {placeholder}
      </div>
      <p className="error">{errorMessage}</p>
      {!customPreview && (
        <div className="preview">
          <ul>
            {files.map((item) => {
              console.log('맵', item, item[0], item.url);
              return (
                <li className="thumbnail" key={item.key}>
                  <img src={item.url} alt="" />
                  <button
                    type="button"
                    className="btn btn-transparent btn-auto"
                    onClick={(e) => {
                      onDelete(e, item.key);
                    }}
                  >
                    x
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

UploadImages.propTypes = {
  filesInfo: PropTypes.shape({ files: PropTypes.array, totalSize: PropTypes.number }),
  customClass: PropTypes.string,
  placeholder: PropTypes.string,
  customPreview: PropTypes.bool,
  multiple: PropTypes.bool,
  maxSize: PropTypes.number,
  showSize: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
};

UploadImages.defaultProps = {
  filesInfo: { files: [], totalSize: 0 },
  customClass: '',
  showSize: false,
  placeholder: '파일을 드래그 앤 드롭 또는 클릭하여 불러오기',
  multiple: false,
  customPreview: false,
  maxSize: 30,
};

export default UploadImages;
