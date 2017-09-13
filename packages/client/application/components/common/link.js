'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

const _extends = Object.assign || function (target) { for (let i = 1; i < arguments.length; i++) { const source = arguments[i]; for (const key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

const _createClass = function () { function defineProperties(target, props) { for (let i = 0; i < props.length; i++) { const descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

const _url = require('url');

const _url2 = _interopRequireDefault(_url);

const _react = require('react');

const _react2 = _interopRequireDefault(_react);

const _reactRedux = require('react-redux');

const _reactRouterRedux = require('react-router-redux');

const _redux = require('redux');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

const LinkComponent = function (_React$Component) {
  _inherits(LinkComponent, _React$Component);

  function LinkComponent() {
    let _ref;

    _classCallCheck(this, LinkComponent);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    const _this = _possibleConstructorReturn(this, (_ref = LinkComponent.__proto__ || Object.getPrototypeOf(LinkComponent)).call.apply(_ref, [this].concat(args)));

    _this.handleClick = _this.handleClick.bind(_this);
    return _this;
  }

  _createClass(LinkComponent, [{
    key: 'handleClick',
    value: function handleClick(e) {
      this.props.onClick(e, this.props.href);
    }
  }, {
    key: 'render',
    value: function render() {
      const props = this.props;

      return _react2.default.createElement(
        'a',
        {
          target: props.external ? '_blank' : null,
          rel: props.external ? 'noopener noreferrer' : null,
          className: props.className,
          href: props.href,
          onClick: this.handleClick,
          onMouseOver: props.onHover,
          title: props.title,
          'data-id': props['data-id']
        },
        props.children
      );
    }
  }]);

  return LinkComponent;
}(_react2.default.Component);

exports.default = (0, _reactRedux.connect)(mapProps, mapDispatch)(LinkComponent);


function mapProps(state, own) {
  const location = state.routing.locationBeforeTransitions;
  const parsed = own.href ? _url2.default.parse(own.href) : location;
  const query = own.query || location.query;

  return {
    href: own.external ? own.href : _url2.default.format({
      pathname: typeof parsed.pathname === 'string' ? _url2.default.resolve(state.base, parsed.pathname) : location.pathname,
      query: _extends({}, location.query, parsed.query, query),
      hash: own.hash
    }),
    children: own.children,
    className: own.className,
    onClick: own.onClick,
    title: own.title
  };
}

function mapDispatch(dispatch, own) {
  return (0, _redux.bindActionCreators)({
    onClick: function onClick(e, href) {
      if (own.onClick) {
        own.onClick(e);
      }
      if (!own.external) {
        e.preventDefault();
        return (0, _reactRouterRedux.push)(href);
      }
      return { type: 'noop', payload: {} };
    }
  }, dispatch);
}