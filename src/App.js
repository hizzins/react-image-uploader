import React, {Component} from 'react';
import UploadImages from './UploadImages';
import './App.scss';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { filesInfo: { files: [], totalSize: 0 } };
  }

  onChange = (data) => {
    const { files, totalSize } = data;
    console.log('onChange', data, files, totalSize);

    this.setState({ filesInfo: { files, totalSize } });
  };

    render() {
      const { onChange } = this;
      const { filesInfo } = this.state;
      return (
        <div className="wrap-app">
          <UploadImages
            customClass="upload"
            placeholder="이미지 업로드"
            multiple
            showSize
            onChange={onChange}
            filesInfo={filesInfo}
          />
        </div>
      );
    }
}

export default App;
